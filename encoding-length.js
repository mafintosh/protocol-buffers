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
  // var encodingLength = genfun()
  // ('function encodingLength (obj) {')
  // ('var length = 0')

  // Object.keys(oneofs).forEach(function (name) {
  //   var msg = JSON.stringify('only one of the properties defined in oneof ' + name + ' can be set')
  //   var cnt = oneofs[name]
  //       .map(function (prop) {
  //         return '+defined(' + genobj('obj', prop) + ')'
  //       })
  //       .join(' + ')

  //   encodingLength('if ((%s) > 1) throw new Error(%s)', cnt, msg)
  // })

  // forEach(function (e, f, val, i) {
  //   var packed = f.repeated && f.options && f.options.packed && f.options.packed !== 'false'
  //   var hl = varint.encodingLength(f.tag << 3 | e.type)

  //   if (f.required) encodingLength('if (!defined(%s)) throw new Error(%s)', val, JSON.stringify(f.name + ' is required'))
  //   else encodingLength('if (defined(%s)) {', val)

    // if (f.map) {
    //   encodingLength()
    //   ('var tmp = Object.keys(%s)', val)
    //   ('for (var i = 0; i < tmp.length; i++) {')

//   ('tmp[i] = {key: tmp[i], value: %s[tmp[i]]}', val)
    //   ('}')
    //   val = 'tmp'
    // }

    // if (packed) {
//       encodingLength()
//       ('var packedLen = 0')
//       ('for (var i = 0; i < %s.length; i++) {', val)
//       ('if (!defined(%s)) continue', val + '[i]')
//       ('var len = enc[%d].encodingLength(%s)', i, val + '[i]')
//       ('packedLen += len')

//       if (e.message) encodingLength('packedLen += varint.encodingLength(len)')

//       encodingLength('}')
//       ('if (packedLen) {')
//       ('length += %d + packedLen + varint.encodingLength(packedLen)', hl)
//       ('}')
//     } else {
//       if (f.repeated) {
//         encodingLength('for (var i = 0; i < %s.length; i++) {', val)
//         val += '[i]'
//         encodingLength('if (!defined(%s)) continue', val)
//       }

//       encodingLength('var len = enc[%d].encodingLength(%s)', i, val)
//       if (e.message) encodingLength('length += varint.encodingLength(len)')
//       encodingLength('length += %d + len', hl)
//       if (f.repeated) encodingLength('}')
//     }

//     if (!f.required) encodingLength('}')
//   })

//   encodingLength()
//   ('return length')
//   ('}')

//   return encodingLength.toFunction({
//     defined: defined,
//     varint: varint,
//     enc: enc
//   })
// }

module.exports = compileEncodingLength
