var varint = require('varint')
var defined = require('./utils').defined

function compileDecode (m, resolve, enc) {
  var baseObj = {}
  var requiredFields = []
  var fields = {}
  var oneofFields = []

  for (var i = 0; i < enc.length; i++) {
    var field = m.fields[i]

    fields[field.tag] = i

    var def = field.options && field.options.default
    var resolved = resolve(field.type, m.id, false)
    var vals = resolved && resolved.values

    if (field.required) {
      requiredFields.push(field.name)
    }

    if (field.oneof) {
      oneofFields.push(field.name)
    }

    if (vals) { // is enum
      if (field.repeated) {
        baseObj[field.name] = []
      } else {
        def = (def && vals[def]) ? vals[def].value : vals[Object.keys(vals)[0]].value
        baseObj[field.name] = parseInt(def || 0, 10)
      }
    } else {
      baseObj[field.name] = defaultValue(field, def)
    }
  }

  function decodeField (e, field, obj, buf, offset, i) {
    if (e.message) {
      var len = varint.decode(buf, offset)
      offset += varint.decode.bytes

      var decoded = e.decode(buf, offset, offset + len)

      if (field.map) {
        obj[field.name][decoded.key] = decoded.value
      } else if (field.repeated) {
        obj[field.name].push(decoded)
      } else {
        obj[field.name] = decoded
      }
    } else {
      if (field.repeated) {
        obj[field.name].push(e.decode(buf, offset))
      } else {
        obj[field.name] = e.decode(buf, offset)
      }
    }

    // clear out duplicate oneofs
    if (field.oneof) {
      var name
      for (var j = 0; j < oneofFields.length; j++) {
        name = oneofFields[j]
        if (field.name !== name) {
          delete obj[name]
        }
      }
    }

    offset += e.decode.bytes
    return offset
  }

  return function decode (buf, offset, end) {
    if (offset == null) {
      offset = 0
    }

    if (end == null) {
      end = buf.length
    }

    if (!(end <= buf.length && offset <= buf.length)) {
      throw new Error('Decoded message is not valid')
    }

    var oldOffset = offset
    var obj = Object.assign({}, baseObj)

    while (true) {
      if (end <= offset) {
        var name
        for (var j = 0; j < requiredFields.length; j++) {
          name = requiredFields[j]
          if (!defined(obj[name])) {
            throw new Error('Decoded message is not valid, missing required field: ' + name)
          }
        }

        decode.bytes = offset - oldOffset
        return obj
      }

      var prefix = varint.decode(buf, offset)
      offset += varint.decode.bytes
      var tag = prefix >> 3

      var i = fields[tag]

      if (i == null) {
        offset = skip(prefix & 7, buf, offset)
        continue
      }

      var e = enc[i]
      var field = m.fields[i]

      var packed = field.repeated && field.options && field.options.packed && field.options.packed !== 'false'

      if (packed) {
        var packedEnd = varint.decode(buf, offset)
        offset += varint.decode.bytes
        packedEnd += offset

        while (offset < packedEnd) {
          offset = decodeField(e, field, obj, buf, offset, i)
        }
      } else {
        offset = decodeField(e, field, obj, buf, offset, i)
      }
    }
  }
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
  if (f.map) return {}
  if (f.repeated) return []

  switch (f.type) {
    case 'string':
      return def != null ? def : ''

    case 'bool':
      return def === 'true'

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
      return parseInt(def || 0, 10)

    default:
      return null
  }
}

module.exports = compileDecode
