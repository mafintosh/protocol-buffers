/* eslint max-depth: 1 */
'use strict'

var varint = require('varint')
var defined = require('./utils').defined

function compileDecode (m, resolve, enc) {
  var requiredFields = []
  var fields = {}
  var oneofFields = []
  var vals = []

  for (var i = 0; i < enc.length; i++) {
    var field = m.fields[i]

    fields[field.tag] = i

    var def = field.options && field.options.default
    var resolved = resolve(field.type, m.id, false)
    vals[i] = [def, resolved && resolved.values]

    m.fields[i].packed = field.repeated && field.options && field.options.packed && field.options.packed !== 'false'

    if (field.required) {
      requiredFields.push(field.name)
    }

    if (field.oneof) {
      oneofFields.push(field.name)
    }
  }

  function decodeField (e, field, obj, buf, offset, i) {
    var name = field.name

    if (field.oneof) {
      // clear already defined oneof fields
      var props = Object.keys(obj)
      for (var j = 0; j < props.length; j++) {
        if (oneofFields.indexOf(props[j]) > -1) {
          delete obj[props[j]]
        }
      }
    }

    if (e.message) {
      var len = varint.decode(buf, offset)
      offset += varint.decode.bytes

      var decoded = e.decode(buf, offset, offset + len)

      if (field.map) {
        obj[name] = obj[name] || {}
        obj[name][decoded.key] = decoded.value
      } else if (field.repeated) {
        obj[name] = obj[name] || []
        obj[name].push(decoded)
      } else {
        obj[name] = decoded
      }
    } else {
      if (field.repeated) {
        obj[name] = obj[name] || []
        obj[name].push(e.decode(buf, offset))
      } else {
        obj[name] = e.decode(buf, offset)
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
    var obj = {}
    var field

    while (true) {
      if (end <= offset) {
        // finished

        // check required methods
        var name = ''
        var j = 0
        for (j = 0; j < requiredFields.length; j++) {
          name = requiredFields[j]
          if (!defined(obj[name])) {
            throw new Error('Decoded message is not valid, missing required field: ' + name)
          }
        }

        // fill out missing defaults
        var val
        var def
        for (j = 0; j < enc.length; j++) {
          field = m.fields[j]
          def = vals[j][0]
          val = vals[j][1]
          name = field.name

          if (defined(obj[name])) {
            continue
          }

          var done = false
          if (field.oneof) {
            var props = Object.keys(obj)
            for (var k = 0; k < props.length; k++) {
              if (oneofFields.indexOf(props[k]) > -1) {
                done = true
                break
              }
            }
          }

          if (done) {
            continue
          }

          if (val) { // is enum
            if (field.repeated) {
              obj[name] = []
            } else {
              def = (def && val[def]) ? val[def].value : val[Object.keys(val)[0]].value
              obj[name] = parseInt(def || 0, 10)
            }
          } else {
            obj[name] = defaultValue(field, def)
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
      field = m.fields[i]

      if (field.packed) {
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
    default:
      throw new Error('Unknown wire type: ' + type)
  }
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
