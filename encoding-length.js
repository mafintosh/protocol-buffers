/* eslint-disable no-spaced-func */
/* eslint-disable no-unexpected-multiline */
/* eslint-disable */
var defined = require('./utils').defined
var varint = require('varint')
var genobj = require('generate-object-property')
var genfun = require('generate-function')

function compileEncodingLength (forEach, enc, oneofs) {
  var encodingLength = genfun()
  ('function encodingLength (obj) {')
  ('var length = 0')

  Object.keys(oneofs).forEach(function (name) {
    var msg = JSON.stringify('only one of the properties defined in oneof ' + name + ' can be set')
    var cnt = oneofs[name]
        .map(function (prop) {
          return '+defined(' + genobj('obj', prop) + ')'
        })
        .join(' + ')

    encodingLength('if ((%s) > 1) throw new Error(%s)', cnt, msg)
  })

  forEach(function (e, f, val, i) {
    var packed = f.repeated && f.options && f.options.packed && f.options.packed !== 'false'
    var hl = varint.encodingLength(f.tag << 3 | e.type)

    if (f.required) encodingLength('if (!defined(%s)) throw new Error(%s)', val, JSON.stringify(f.name + ' is required'))
    else encodingLength('if (defined(%s)) {', val)

    if (f.map) {
      encodingLength()
      ('var tmp = Object.keys(%s)', val)
      ('for (var i = 0; i < tmp.length; i++) {')
      ('tmp[i] = {key: tmp[i], value: %s[tmp[i]]}', val)
      ('}')
      val = 'tmp'
    }

    if (packed) {
      encodingLength()
      ('var packedLen = 0')
      ('for (var i = 0; i < %s.length; i++) {', val)
      ('if (!defined(%s)) continue', val + '[i]')
      ('var len = enc[%d].encodingLength(%s)', i, val + '[i]')
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

  return encodingLength.toFunction({
    defined: defined,
    varint: varint,
    enc: enc
  })
}

module.exports = compileEncodingLength
