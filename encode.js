/* eslint-disable no-spaced-func */
/* eslint-disable no-unexpected-multiline */
var defined = require('./utils').defined
var varint = require('varint')
// var genobj = require('generate-object-property')
// var genfun = require('generate-function')

function compileEncode (m, resolve, forEach, enc, oneofs, encodingLength) {
  var oneofsKeys = Object.keys(oneofs)

  var ints = {}
  for (var i = 0; i < enc.length; i++) {
    ints[i] = {
      p: varint.encode(m.fields[i].tag << 3 | 2),
      h: varint.encode(m.fields[i].tag << 3 | enc[i].type)
    }
  }

  function encodeField (buf, offset, h, e, packed, innerVal) {
    var j = 0
    if (!packed) {
      for (j = 0; j < h.length; j++) {
        buf[offset++] = h[j]
      }
    }

    if (e.message) {
      varint.encode(e.encodingLength(innerVal), buf, offset)
      offset += varint.encode.bytes
    }

    e.encode(innerVal, buf, offset)
    return offset + e.encode.bytes
  }

  return function encode (obj, buf, offset) {
    if (offset == null) {
      offset = 0
    }
    if (buf == null) {
      buf = Buffer.allocUnsafe(encodingLength(obj))
    }

    var oldOffset = offset
    var objKeys = Object.keys(obj)
    var i = 0

    // oneof checks

    var match = false
    for (i = 0; i < oneofsKeys.length; i++) {
      var name = oneofsKeys[i]
      var prop = oneofs[i]
      if (objKeys.indexOf(prop) > -1) {
        if (match) {
          throw new Error('only one of the propoerties defined in oneof ' + name + ' can be set')
        }

        match = true
      }
    }

    for (i = 0; i < enc.length; i++) {
      var e = enc[i]
      var field = m.fields[i] // was f
      var val = obj[field.name]
      var j = 0

      if (!defined(val)) {
        if (field.required) {
          throw new Error(field.name + ' is required')
        }
        continue
      }
      var p = ints[i].p
      var h = ints[i].h

      var packed = field.repeated && field.options && field.options.packed && field.options.packed !== 'false'

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

      if (packed) {
        var packedLen = 0
        for (j = 0; j < val.length; j++) {
          if (!defined(val[j])) {
            continue
          }

          packedLen += e.encodingLength(val[j])
        }

        if (packedLen) {
          for (j = 0; j < h.length; j++) {
            buf[offset++] = p[j]
          }
          varint.encode(packedLen, buf, offset)
          offset += varint.encode.bytes
        }
      }

      if (field.repeated) {
        var innerVal
        for (j = 0; j < val.length; j++) {
          innerVal = val[j]
          if (!defined(innerVal)) {
            continue
          }
          offset = encodeField(buf, offset, h, e, packed, innerVal)
        }
      } else {
        offset = encodeField(buf, offset, h, e, packed, val)
      }
    }

    encode.bytes = offset - oldOffset
    return buf
  }
}
  // var encode = genfun()
  // ('function encode (obj, buf, offset) {')
  // ('if (!offset) offset = 0')
  // ('if (!buf) buf = new Buffer(encodingLength(obj))')
  // ('var oldOffset = offset')

  // Object.keys(oneofs).forEach(function (name) {
  //   var msg = JSON.stringify('only one of the properties defined in oneof ' + name + ' can be set')
  //   var cnt = oneofs[name]
  //       .map(function (prop) {
  //         return '+defined(' + genobj('obj', prop) + ')'
  //       })
  //       .join(' + ')

  //   encode('if ((%s) > 1) throw new Error(%s)', cnt, msg)
  // })

  // forEach(function (e, f, val, i) {
    // if (f.required) encode('if (!defined(%s)) throw new Error(%s)', val, JSON.stringify(f.name + ' is required'))
    // else encode('if (defined(%s)) {', val)

    // var packed = f.repeated && f.options && f.options.packed && f.options.packed !== 'false'
    // var p = varint.encode(f.tag << 3 | 2)
    // var h = varint.encode(f.tag << 3 | e.type)
    // var j

    // if (f.map) {
    //   encode()
    //   ('var tmp = Object.keys(%s)', val)
    //   ('for (var i = 0; i < tmp.length; i++) {')
    //   ('tmp[i] = {key: tmp[i], value: %s[tmp[i]]}', val)
    //   ('}')
    //   val = 'tmp'
    // }

    // if (packed) {
    //   encode()
    //   ('var packedLen = 0')
    //   ('for (var i = 0; i < %s.length; i++) {', val)
    //   ('if (!defined(%s)) continue', val + '[i]')
    //   ('packedLen += enc[%d].encodingLength(%s)', i, val + '[i]')
    //   ('}')

    //   encode('if (packedLen) {')
    //   for (j = 0; j < h.length; j++) encode('buf[offset++] = %d', p[j])
    //   encode('varint.encode(packedLen, buf, offset)')
    //   encode('offset += varint.encode.bytes')
    //   encode('}')
    // }

    // if (f.repeated) {
    //   encode('for (var i = 0; i < %s.length; i++) {', val)
    //   val += '[i]'
    //   encode('if (!defined(%s)) continue', val)
    // }

    // if (!packed) for (j = 0; j < h.length; j++) encode('buf[offset++] = %d', h[j])

    // if (e.message) {
    //   encode('varint.encode(enc[%d].encodingLength(%s), buf, offset)', i, val)
    //   encode('offset += varint.encode.bytes')
    // }

    // encode('enc[%d].encode(%s, buf, offset)', i, val)
    // encode('offset += enc[%d].encode.bytes', i)

    // if (f.repeated) encode('}')
    // if (!f.required) encode('}')
  // })

  // encode()
  // ('encode.bytes = offset - oldOffset')
  // ('return buf')
  // ('}')

  // return encode.toFunction({
  //   encodingLength: encodingLength,
  //   defined: defined,
  //   varint: varint,
  //   enc: enc,
  //   Buffer: Buffer
  // })
// }

module.exports = compileEncode
