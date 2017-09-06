var defined = require('./utils').defined
var varint = require('varint')

function compileEncodingLength (m, enc, oneofs) {
  var oneofsKeys = Object.keys(oneofs)

  var hls = []
  for (var i = 0; i < m.fields.length; i++) {
    hls.push(varint.encodingLength(m.fields[i].tag << 3 | enc[i].type))
  }

  function encodingLengthField (e, val, length, i) {
    var len = e.encodingLength(val)
    if (e.message) {
      length += varint.encodingLength(len)
    }

    return length + hls[i] + len
  }

  return function encodingLength (obj) {
    var length = 0
    var i = 0
    var j = 0

    for (i = 0; i < oneofsKeys.length; i++) {
      var name = oneofsKeys[i]
      var props = oneofs[name]

      var match = false
      for (j = 0; j < props.length; j++) {
        if (defined(obj[props[j]])) {
          if (match) {
            throw new Error('only one of the properties defined in oneof ' + name + ' can be set')
          }
          match = true
        }
      }
    }

    for (i = 0; i < enc.length; i++) {
      var e = enc[i]
      var field = m.fields[i]
      var val = obj[field.name]

      var packed = field.repeated && field.options && field.options.packed && field.options.packed !== 'false'

      var hl = hls[i]

      if (!defined(val)) {
        if (field.required) {
          throw new Error(field.name + ' is required')
        }

        continue
      }

      if (field.map) {
        var tmp = Object.keys(val)
        for (j = 0; j < tmp.length; j++) {
          tmp[j] = {
            key: tmp[j],
            value: val[tmp[j]]
          }
        }
        console.log('map', tmp, val)
        val = tmp
      }

      if (packed) {
        var packedLen = 0
        for (j = 0; j < val.length; j++) {
          if (!defined(val[j])) {
            continue
          }
          var len = e.encodingLength(val[j])
          packedLen += len

          if (e.message) {
            packedLen += varint.encodingLength(len)
          }
        }

        if (packedLen) {
          length += hl + packedLen + varint.encodingLength(packedLen)
        }
      } else if (field.repeated) {
        for (j = 0; j < val.length; j++) {
          if (!defined(val[j])) {
            continue
          }

          length = encodingLengthField(e, val[j], length, i)
        }
      } else {
        length = encodingLengthField(e, val, length, i)
      }
    }

    return length
  }
}

module.exports = compileEncodingLength
