'use strict'

var defined = require('./utils').defined
var varint = require('varint')

function compileEncodingLength (m, enc, oneofs) {
  var oneofsKeys = Object.keys(oneofs)
  var encLength = enc.length

  var hls = new Array(encLength)

  for (var i = 0; i < m.fields.length; i++) {
    hls[i] = varint.encodingLength(m.fields[i].tag << 3 | enc[i].type)

    var field = m.fields[i]
    m.fields[i].packed = field.repeated && field.options && field.options.packed && field.options.packed !== 'false'
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

    for (i = 0; i < encLength; i++) {
      var e = enc[i]
      var field = m.fields[i]
      var val = obj[field.name]
      var hl = hls[i]
      var len

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

        val = tmp
      }

      if (field.packed) {
        var packedLen = 0
        for (j = 0; j < val.length; j++) {
          if (!defined(val[j])) {
            continue
          }
          len = e.encodingLength(val[j])
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

          len = e.encodingLength(val[j])
          length += hl + len + (e.message ? varint.encodingLength(len) : 0)
        }
      } else {
        len = e.encodingLength(val)
        length += hl + len + (e.message ? varint.encodingLength(len) : 0)
      }
    }

    return length
  }
}

module.exports = compileEncodingLength
