/* eslint-disable no-spaced-func */
/* eslint-disable no-unexpected-multiline */
var varint = require('varint')
var genobj = require('generate-object-property')
var genfun = require('generate-function')

function compileDecode (m, resolve, forEach, enc) {
  var invalid = m.fields
      .map(function (f, i) {
        return f.required && '!found' + i
      })
      .filter(function (f) {
        return f
      })
      .join(' || ')

  var decode = genfun()

  var objectKeys = []
  forEach(function (e, f) {
    var def = f.options && f.options.default
    var resolved = resolve(f.type, m.id, false)
    var vals = resolved && resolved.values

    if (vals) { // is enum
      if (f.repeated) {
        objectKeys.push(genobj.property(f.name) + ': []')
      } else {
        def = (def && vals[def]) ? vals[def].value : vals[Object.keys(vals)[0]].value
        objectKeys.push(genobj.property(f.name) + ': ' + parseInt(def || 0, 10))
      }
      return
    }

    objectKeys.push(genobj.property(f.name) + ': ' + defaultValue(f, def))
  })

  decode()
  ('function decode (buf, offset, end) {')
  ('if (!offset) offset = 0')
  ('if (!end) end = buf.length')
  ('if (!(end <= buf.length && offset <= buf.length)) throw new Error("Decoded message is not valid")')
  ('var oldOffset = offset')
  ('var obj = {')

  objectKeys.forEach(function (prop, i) {
    decode(prop + (i === objectKeys.length - 1 ? '' : ','))
  })

  decode('}')

  forEach(function (e, f, val, i) {
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

  forEach(function (e, f, val, i) {
    var packed = f.repeated && f.options && f.options.packed && f.options.packed !== 'false'

    decode('case %d:', f.tag)

    if (f.oneof) {
      m.fields.forEach(function (otherField) {
        if (otherField.oneof === f.oneof && f.name !== otherField.name) {
          decode('delete %s', genobj('obj', otherField.name))
        }
      })
    }

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
      if (f.map) {
        decode('var tmp = enc[%d].decode(buf, offset, offset + len)', i)
        decode('%s[tmp.key] = tmp.value', val)
      } else if (f.repeated) {
        decode('%s.push(enc[%d].decode(buf, offset, offset + len))', val, i)
      } else {
        decode('%s = enc[%d].decode(buf, offset, offset + len)', val, i)
      }
    } else {
      if (f.repeated) {
        decode('%s.push(enc[%d].decode(buf, offset))', val, i)
      } else {
        decode('%s = enc[%d].decode(buf, offset)', val, i)
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

  return decode.toFunction({
    varint: varint,
    skip: skip,
    enc: enc
  })
}

var skip = function (type, buffer, offset) {
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

  throw new Error('Unknown wire type: ' + type)
}

var defaultValue = function (f, def) {
  if (f.map) return '{}'
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
      return '' + Number(def || 0)

    default:
      return 'null'
  }
}

var isString = function (def) {
  try {
    return !!def && typeof JSON.parse(def) === 'string'
  } catch (err) {
    return false
  }
}

module.exports = compileDecode
