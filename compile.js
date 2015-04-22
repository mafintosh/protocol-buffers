var encodings = require('./encodings')
var varint = require('varint')
var genobj = require('generate-object-property')
var genfun = require('generate-function')

var skip = function(type, buffer, offset) {
  switch (type) {
    case 0:
    varint.decode(buffer, offset)
    return offset + varint.decode.bytes

    case 1:
    return offset + 8

    case 2:
    var len = varint.decode(buffer, offset)
    return offset + varint.decode.bytes + len

    case 3:
    case 4:
    throw new Error('Groups are not supported')

    case 5:
    return offset + 4
  }

  throw new Error('Unknown wire type: '+type)
}

var defined = function(val) {
  return val !== null && val !== undefined
}

var isString = function(def) {
  try {
    return !!def && typeof JSON.parse(def) === 'string'
  } catch (err) {
    return false
  }
}

var defaultValue = function(f, def) {
  if (f.repeated) return '[]'

  switch (f.type) {
    case 'string':
    return isString(def) ? def : '""'

    case 'bool':
    if (def === 'true') return 'true'
    return 'false'

    case 'float':
    case 'double':
    case 'sfixed32':
    case 'fixed32':
    case 'varint':
    case 'enum':
    case 'uint64':
    case 'uint32':
    case 'int64':
    case 'int32':
    case 'sint64':
    case 'sint32':
    return ''+parseInt(def || 0)

    default:
    return 'null'
  }
}

module.exports = function(schema, extraEncodings) {
  var messages = {}
  var enums = {}
  var cache = {}

  var visit = function(schema, prefix) {
    if (schema.enums) {
      schema.enums.forEach(function(e) {
        e.id = prefix + (prefix ? '.' : '')+e.name
        enums[e.id] = e
        visit(e, e.id)
      })
    }
    if (schema.messages) {
      schema.messages.forEach(function(m) {
        m.id = prefix + (prefix ? '.' : '')+m.name
        messages[m.id] = m
        visit(m, m.id)
      })
    }
  }

  visit(schema, '')

  var compileEnum = function(e) {
    var conditions = Object.keys(e.values)
      .map(function(k) {
        return 'val !== '+parseInt(e.values[k])
      })
      .join(' && ')

    if (!conditions) conditions = 'true'

    var encode = genfun()
      ('function encode(val, buf, offset) {')
        ('if (%s) throw new Error("Invalid enum value: "+val)', conditions)
        ('varint.encode(val, buf, offset)')
        ('encode.bytes = varint.encode.bytes')
        ('return buf')
      ('}')
      .toFunction({
        varint: varint
      })

    var decode = genfun()
      ('function decode(buf, offset) {')
        ('var val = varint.decode(buf, offset)')
        ('if (%s) throw new Error("Invalid enum value: "+val)', conditions)
        ('decode.bytes = varint.decode.bytes')
        ('return val')
      ('}')
      .toFunction({
        varint: varint
      })

    return encodings.make(0, encode, decode, varint.encodingLength)
  }

  var compileMessage = function(m, exports) {
    m.messages.forEach(function (nested) {
      exports[nested.name] = resolve(nested.name, m.id)
    })

    m.enums.forEach(function( val ) {
      exports[val.name] = val.values
    })

    exports.type = 2
    exports.message = true
    exports.name = m.name

    var oneofMap = {}
    var oneofs = []
    m.oneof.forEach(function(o) {
      o.fields.forEach(function(f) {
        oneofMap[f.name] = o.name
        oneofs.push({
          name: f.name,
          type: f.type,
          tag: f.tag,
          required: false,
          oneof: o.name
        })
      })
    })

    var fields = m.fields.concat(oneofs)
    var enc = fields.map(function(f) {
      return resolve(f.type, m.id)
    })

    var forEach = function(fn) {
      for (var i = 0; i < enc.length; i++) fn(enc[i], fields[i], genobj('obj', fields[i].name), i)
    }

    // compile encodingLength

    var encodingLength = genfun()
      ('function encodingLength(obj) {')
        ('var length = 0')

    forEach(function(e, f, val, i) {
      var packed = f.repeated && f.options && f.options.packed
      var hl = varint.encodingLength(f.tag << 3 | e.type)

      if (f.required) encodingLength('if (!defined(%s)) throw new Error(%s)', val, JSON.stringify(f.name+' is required'))
      else encodingLength('if (defined(%s)) {', val)

      if (packed) {
        encodingLength()
          ('var packedLen = 0')
          ('for (var i = 0; i < %s.length; i++) {', val)
            ('if (!defined(%s)) continue', val+'[i]')
            ('var len = enc[%d].encodingLength(%s)', i, val+'[i]')
            ('packedLen += len')
            if (e.message) encodingLength('packedLen += varint.encodingLength(len)')
          encodingLength('}')
          ('if (packedLen) {')
            ('length += %d + packedLen + varint.encodingLength(packedLen)', hl)
          ('}')
      } else {
        if (f.repeated) {
          encodingLength('for (var i = 0; i < %s.length; i++) {', val)
          val += '[i]'
          encodingLength('if (!defined(%s)) continue', val)
        }

        encodingLength('var len = enc[%d].encodingLength(%s)', i, val)
        if (e.message) encodingLength('length += varint.encodingLength(len)')
        encodingLength('length += %d + len', hl)
        if (f.repeated) encodingLength('}')
      }

      if (!f.required) encodingLength('}')
    })

    encodingLength()
        ('return length')
      ('}')

    encodingLength = encodingLength.toFunction({
      defined: defined,
      varint: varint,
      enc: enc
    })

    // compile encode

    var encode = genfun()
      ('function encode(obj, buf, offset) {')
        if (oneofs.length) {
          // build up clean object with only the last field set for each oneof
          encode()
          ('var cleanObj={}, foundOneofs = {}')
          ('var oneofs = %s', JSON.stringify(oneofMap))
          ('for (var f in obj) {')
            ('cleanObj[f] = obj[f]')
            ('if (oneofs[f]) {')
              ('if (foundOneofs[oneofs[f]]) {')
                ('delete cleanObj[foundOneofs[oneofs[f]]]')
              ('}')
              ('foundOneofs[oneofs[f]] = f')
            ('}')
          ('}')
          ('obj = cleanObj')
        }
        encode()
        ('if (!offset) offset = 0')
        ('if (!buf) buf = new Buffer(encodingLength(obj))')
        ('var oldOffset = offset')

    forEach(function(e, f, val, i) {
      if (f.required) encode('if (!defined(%s)) throw new Error(%s)', val, JSON.stringify(f.name+' is required'))
      else encode('if (defined(%s)) {', val)

      var packed = f.repeated && f.options && f.options.packed
      var p = varint.encode(f.tag << 3 | 2)
      var h = varint.encode(f.tag << 3 | e.type)

      if (packed) {
        encode()
          ('var packedLen = 0')
          ('for (var i = 0; i < %s.length; i++) {', val)
            ('if (!defined(%s)) continue', val+'[i]')
            ('packedLen += enc[%d].encodingLength(%s)', i, val+'[i]')
          ('}')

        encode('if (packedLen) {')
        for (var j = 0; j < h.length; j++) encode('buf[offset++] = %d', p[j])
        encode('varint.encode(packedLen, buf, offset)')
        encode('offset += varint.encode.bytes')
        encode('}')
      }

      if (f.repeated) {
        encode('for (var i = 0; i < %s.length; i++) {', val)
        val += '[i]'
        encode('if (!defined(%s)) continue', val)
      }

      if (!packed) for (var j = 0; j < h.length; j++) encode('buf[offset++] = %d', h[j])

      if (e.message) {
        encode('varint.encode(enc[%d].encodingLength(%s), buf, offset)', i, val)
        encode('offset += varint.encode.bytes')
      }

      encode('enc[%d].encode(%s, buf, offset)', i, val)
      encode('offset += enc[%d].encode.bytes', i)

      if (f.repeated) encode('}')
      if (!f.required) encode('}')
    })

    encode()
        ('encode.bytes = offset - oldOffset')
        ('return buf')
      ('}')

    encode = encode.toFunction({
      encodingLength: encodingLength,
      defined: defined,
      varint: varint,
      enc: enc,
      Buffer: Buffer
    })

    // compile proto

    var Message = genfun()

    Message('function Message() {')
    forEach(function(e, f) {
      var def = f.options && f.options.default
      var resolved = resolve(f.type, m.id, false)
      var vals = resolved && resolved.values

      if (vals) { // is enum
        if (f.repeated) {
          Message('%s = []', genobj('this', f.name))
        } else {
          def = (def && def in vals) ? vals[def] : vals[Object.keys(vals)[0]]
          Message('%s = %s', genobj('this', f.name), ''+parseInt(def || 0))
        }
        return
      }

      // only set defaults if not a oneof
      if (f.oneof == null) {
        Message('%s = %s', genobj('this', f.name), defaultValue(f, def))
      }
    })
    Message('}')

    Message = Message.toFunction()

    // compile decode

    var invalid = m.fields
      .map(function(f, i) {
        return f.required && '!found'+i
      })
      .filter(function(f) {
        return f
      })
      .join(' || ')

    var decode = genfun()

    decode()
      ('function decode(buf, offset, end) {')
        ('if (!offset) offset = 0')
        ('if (!end) end = buf.length')
        ('if (!(end <= buf.length && offset <= buf.length)) throw new Error("Decoded message is not valid")')
        ('var oldOffset = offset')
        ('var obj = new Message()')
        if (oneofs.length) {
          decode()
          ('var oneofs = %s', JSON.stringify(oneofMap))
          ('var foundOneofs = {}')
        }

    forEach(function(e, f, val, i) {
      if (f.required) decode('var found%d = false', i)
    })

    decode('while (true) {')
      ('if (end <= offset) {')
        (invalid && 'if (%s) throw new Error("Decoded message is not valid")', invalid)
        ('decode.bytes = offset - oldOffset')
        ('return obj')
      ('}')
      ('var prefix = varint.decode(buf, offset)')
      ('offset += varint.decode.bytes')
      ('var tag = prefix >> 3')
      ('switch (tag) {')

    forEach(function(e, f, val, i) {
      var packed = f.repeated && f.options && f.options.packed

      decode('case %d:', f.tag)

      if (packed) {
        decode()
          ('var packedEnd = varint.decode(buf, offset)')
          ('offset += varint.decode.bytes')
          ('packedEnd += offset')
          ('while (offset < packedEnd) {')
      }

      if (e.message) {
        decode('var len = varint.decode(buf, offset)')
        decode('offset += varint.decode.bytes')
        if (f.repeated) decode('%s.push(enc[%d].decode(buf, offset, offset + len))', val, i)
        else decode('%s = enc[%d].decode(buf, offset, offset + len)', val, i)
      } else {
        if (f.repeated) decode('%s.push(enc[%d].decode(buf, offset))', val, i)
        else {
          decode('%s = enc[%d].decode(buf, offset)', val, i)
          // if a oneof, only keep the last value in the buffer
          if (oneofs.length && f.oneof) {
            decode('var f = "%s"', f.name)
            ('if (oneofs[f]) {')
              ('if (foundOneofs[oneofs[f]]) {')
                ('delete obj[foundOneofs[oneofs[f]]]')
              ('}')
              ('foundOneofs[oneofs[f]] = f')
            ('}')
          }
        }
      }

      decode('offset += enc[%d].decode.bytes', i)

      if (packed) decode('}')
      if (f.required) decode('found%d = true', i)
      decode('break')
    })

    decode()
          ('default:')
          ('offset = skip(prefix & 7, buf, offset)')
        ('}')
      ('}')
    ('}')

    decode = decode.toFunction({
      Message: Message,
      varint: varint,
      skip: skip,
      enc: enc
    })


    // end of compilation - return all the things

    encode.bytes = decode.bytes = 0

    exports.buffer = true
    exports.encode = encode
    exports.decode = decode
    exports.encodingLength = encodingLength

    return exports
  }

  var resolve = function(name, from, compile) {
    if (extraEncodings && extraEncodings[name]) return extraEncodings[name]
    if (encodings[name]) return encodings[name]

    var m = (from ? from+'.'+name : name).split('.')
      .map(function(part, i, list) {
        return list.slice(0, i).concat(name).join('.')
      })
      .reverse()
      .reduce(function(result, id) {
        return result || messages[id] || enums[id]
      }, null)

    if (compile === false) return m
    if (!m) throw new Error('Could not resolve '+name)

    if (m.values) return compileEnum(m)
    return cache[m.id] || compileMessage(m, cache[m.id] = {})
  }

  return (schema.enums || []).concat((schema.messages || []).map(function(message) {
    return resolve(message.id)
  }))
}
