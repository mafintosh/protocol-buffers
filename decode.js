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

  // var invalid = m.fields
  //     .map(function (f, i) {
  //       return f.required && '!found' + i
  //     })
  //     .filter(function (f) {
  //       return f
  //     })
  //     .join(' || ')

  // var decode = genfun()

  // var objectKeys = []
  // forEach(function (e, f) {
  //   var def = f.options && f.options.default
  //   var resolved = resolve(f.type, m.id, false)
  //   var vals = resolved && resolved.values

  //   if (vals) { // is enum
  //     if (f.repeated) {
  //       objectKeys.push(genobj.property(f.name) + ': []')
  //     } else {
  //       def = (def && vals[def]) ? vals[def].value : vals[Object.keys(vals)[0]].value
  //       objectKeys.push(genobj.property(f.name) + ': ' + parseInt(def || 0, 10))
  //     }
  //     return
  //   }

  //   objectKeys.push(genobj.property(f.name) + ': ' + defaultValue(f, def))
  // })

  // decode()
  // ('function decode (buf, offset, end) {')
  // ('if (!offset) offset = 0')
  // ('if (!end) end = buf.length')
  // ('if (!(end <= buf.length && offset <= buf.length)) throw new Error("Decoded message is not valid")')
  // ('var oldOffset = offset')
  // ('var obj = {')

  // objectKeys.forEach(function (prop, i) {
  //   decode(prop + (i === objectKeys.length - 1 ? '' : ','))
  // })

  // decode('}')

  // forEach(function (e, f, val, i) {
  //   if (f.required) decode('var found%d = false', i)
  // })

//  decode('while (true) {')
//  ('if (end <= offset) {')
//  (invalid && 'if (%s) throw new Error("Decoded message is not valid")', invalid)
//  ('decode.bytes = offset - oldOffset')
//  ('return obj')
//  ('}')
  // ('var prefix = varint.decode(buf, offset)')
  // ('offset += varint.decode.bytes')
  // ('var tag = prefix >> 3')
  // ('switch (tag) {')

  // forEach(function (e, f, val, i) {
  //   var packed = f.repeated && f.options && f.options.packed && f.options.packed !== 'false'

   // decode('case %d:', f.tag)

    // if (f.oneof) {
    //   m.fields.forEach(function (otherField) {
    //     if (otherField.oneof === f.oneof && f.name !== otherField.name) {
    //       decode('delete %s', genobj('obj', otherField.name))
    //     }
    //   })
    // }

    // if (packed) {
    //   decode()
    //   ('var packedEnd = varint.decode(buf, offset)')
    //   ('offset += varint.decode.bytes')
    //   ('packedEnd += offset')
    //   ('while (offset < packedEnd) {')
    // }

    // if (e.message) {
    //   decode('var len = varint.decode(buf, offset)')
    //   decode('offset += varint.decode.bytes')
    //   if (f.map) {
    //     decode('var tmp = enc[%d].decode(buf, offset, offset + len)', i)
    //     decode('%s[tmp.key] = tmp.value', val)
    //   } else if (f.repeated) {
    //     decode('%s.push(enc[%d].decode(buf, offset, offset + len))', val, i)
    //   } else {
    //     decode('%s = enc[%d].decode(buf, offset, offset + len)', val, i)
    //   }
    // } else {
    //   if (f.repeated) {
    //     decode('%s.push(enc[%d].decode(buf, offset))', val, i)
    //   } else {
    //     decode('%s = enc[%d].decode(buf, offset)', val, i)
    //   }
    // }

    // decode('offset += enc[%d].decode.bytes', i)

// if (packed) decode('}')
//    if (f.required) decode('found%d = true', i)
//    decode('break')
//  })

//   decode()
//   ('default:')
//   ('offset = skip(prefix & 7, buf, offset)')
//   ('}')
//   ('}')
//   ('}')

//   return decode.toFunction({
//     varint: varint,
//     skip: skip,
//     enc: enc
//   })
// }

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
