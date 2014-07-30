var encodings = require('./encodings')
var varint = require('varint')
var genobj = require('generate-object-property')
var genfun = require('generate-function')

var defined = function(val) {
  return val !== null && val !== undefined
}

module.exports = function(schema) {
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

    return encodings.make(0, encode, decode, varint.encodingLength)
  }

  var compileMessage = function(m) {
    var headers = []

    var enc = m.fields.map(function(f, i) {
      var e = resolve(f.type, m.id)
      headers[i] = new Buffer(varint.encode(f.tag << 3 | e.type))
      return e
    })

    var forEach = function(fn) {
      for (var i = 0; i < enc.length; i++) fn(enc[i], m.fields[i], headers[i], genobj('obj', m.fields[i].name), i)
    }

    // compile encodingLength

    var encodingLength = genfun()
      ('function encodingLength(obj) {')
        ('var length = 0')

    forEach(function(e, f, h, val, i) {
      if (f.required) encodingLength('if (!defined(%s)) throw new Error(%s)', val, JSON.stringify(f.name+' is required'))
      else encodingLength('if (defined(%s)) {', val)

      if (f.repeated) {
        encodingLength('for (var i = 0; i < %s.length; i++) {', val)
        val += '[i]'
        encodingLength('if (!defined(%s)) continue', val)
      }

      encodingLength('var len = enc[%d].encodingLength(%s)', i, val)
      if (e.message) encodingLength('length += varint.encodingLength(len)')
      encodingLength('length += %d + len', h.length)

      if (f.repeated) encodingLength('}')
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
        ('if (!offset) offset = 0')
        ('if (!buf) buf = new Buffer(encodingLength(obj))')
        ('var oldOffset = offset')

    forEach(function(e, f, h, val, i) {
      if (f.required) encode('if (!defined(%s)) throw new Error(%s)', val, JSON.stringify(f.name+' is required'))
      else encode('if (defined(%s)) {', val)

      if (f.repeated) {
        encode('for (var i = 0; i < %s.length; i++) {', val)
        val += '[i]'
        encode('if (!defined(%s)) continue', val)
      }

      for (var j = 0; j < h.length; j++) encode('buf[offset++] = %d', h[j])

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
      enc: enc
    })

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
      ('function decode(buf, offset, end) {')
        ('if (!offset) offset = 0')
        ('if (!end) end = buf.length')
        ('var oldOffset = offset')
        ('var obj = {}')

    forEach(function(e, f, h, val, i) {
      if (f.required) decode('var found%d = false', i)
      if (f.repeated) decode('%s = []', val)
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

    forEach(function(e, f, h, val, i) {
      decode('case %d:', f.tag)

      if (e.message) {
        decode('var len = varint.decode(buf, offset)')
        decode('offset += varint.decode.bytes')
        if (f.repeated) decode('%s.push(enc[%d].decode(buf, offset, offset + len))', val, i)
        else decode('%s = enc[%d].decode(buf, offset, offset + len)', val, i)
      } else {
        if (f.repeated) decode('%s.push(enc[%d].decode(buf, offset))', val, i)
        else decode('%s = enc[%d].decode(buf, offset)', val, i)
      }

      if (f.required) decode('found%d = true', i)

      decode()
        ('offset += enc[%d].decode.bytes', i)
        ('break')
    })

    decode()
          ('default:')
          ('throw new Error("Unknown tag: "+tag)')
        ('}')
      ('}')
    ('}')

    decode = decode.toFunction({
      varint: varint,
      enc: enc
    })

    // end of compilation - return the things

    encode.bytes = decode.bytes = 0

    return {
      type: 2,
      message: true,
      name: m.name,
      encode: encode,
      decode: decode,
      encodingLength: encodingLength
    }
  }

  var resolve = function(name, from) {
    if (encodings[name]) return encodings[name]

    var m = (from ? from+'.'+name : name).split('.')
      .map(function(part, i, list) {
        return list.slice(0, i).concat(name).join('.')
      })
      .reverse()
      .reduce(function(result, id) {
        return result || messages[id] || enums[id]
      }, null)

    if (!m) throw new Error('Could not resolve '+name)

    if (m.values) return compileEnum(m)
    return cache[m.id] || (cache[m.id] = compileMessage(m))
  }

  return schema.enums.concat(schema.messages.map(function(message) {
    return resolve(message.id)
  }))
}