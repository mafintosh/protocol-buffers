'use strict'

var encodings = require('./encodings')
var compileDecode = require('./decode')
var compileEncode = require('./encode')
var compileEncodingLength = require('./encoding-length')
var varint = require('varint')

var flatten = function (values) {
  if (!values) return null
  var result = {}
  Object.keys(values).forEach(function (k) {
    result[k] = values[k].value
  })
  return result
}

module.exports = function (schema, extraEncodings) {
  var messages = {}
  var enums = {}
  var cache = {}

  var visit = function (schema, prefix) {
    if (schema.enums) {
      schema.enums.forEach(function (e) {
        e.id = prefix + (prefix ? '.' : '') + e.name
        enums[e.id] = e
        visit(e, e.id)
      })
    }
    if (schema.messages) {
      schema.messages.forEach(function (m) {
        m.id = prefix + (prefix ? '.' : '') + m.name
        messages[m.id] = m
        m.fields.forEach(function (f) {
          if (!f.map) return

          var name = 'Map_' + f.map.from + '_' + f.map.to
          var map = {
            name: name,
            enums: [],
            messages: [],
            fields: [{
              name: 'key',
              type: f.map.from,
              tag: 1,
              repeated: false,
              required: true
            }, {
              name: 'value',
              type: f.map.to,
              tag: 2,
              repeated: false,
              required: false
            }],
            extensions: null,
            id: prefix + (prefix ? '.' : '') + name
          }

          if (!messages[map.id]) {
            messages[map.id] = map
            schema.messages.push(map)
          }
          f.type = name
          f.repeated = true
        })
        visit(m, m.id)
      })
    }
  }

  visit(schema, '')

  var compileEnum = function (e) {
    var values = Object.keys(e.values || []).map(function (k) {
      return parseInt(e.values[k].value, 10)
    })

    var encode = function encode (val, buf, offset) {
      if (!values.length || values.indexOf(val) === -1) {
        throw new Error('Invalid enum value: ' + val)
      }
      varint.encode(val, buf, offset)
      encode.bytes = varint.encode.bytes
      return buf
    }

    var decode = function decode (buf, offset) {
      var val = varint.decode(buf, offset)
      if (!values.length || values.indexOf(val) === -1) {
        throw new Error('Invalid enum value: ' + val)
      }
      decode.bytes = varint.decode.bytes
      return val
    }

    return encodings.make(0, encode, decode, varint.encodingLength)
  }

  var compileMessage = function (m, exports) {
    m.messages.forEach(function (nested) {
      exports[nested.name] = resolve(nested.name, m.id)
    })

    m.enums.forEach(function (val) {
      exports[val.name] = flatten(val.values)
    })

    exports.type = 2
    exports.message = true
    exports.name = m.name

    var oneofs = {}

    m.fields.forEach(function (f) {
      if (!f.oneof) return
      if (!oneofs[f.oneof]) oneofs[f.oneof] = []
      oneofs[f.oneof].push(f.name)
    })

    var enc = m.fields.map(function (f) {
      return resolve(f.type, m.id)
    })

    var encodingLength = compileEncodingLength(m, enc, oneofs)
    var encode = compileEncode(m, resolve, enc, oneofs, encodingLength)
    var decode = compileDecode(m, resolve, enc)

    // end of compilation - return all the things

    encode.bytes = decode.bytes = 0

    exports.buffer = true
    exports.encode = encode
    exports.decode = decode
    exports.encodingLength = encodingLength

    return exports
  }

  var resolve = function (name, from, compile) {
    if (extraEncodings && extraEncodings[name]) return extraEncodings[name]
    if (encodings[name]) return encodings[name]

    var m = (from ? from + '.' + name : name).split('.')
      .map(function (part, i, list) {
        return list.slice(0, i).concat(name).join('.')
      })
      .reverse()
      .reduce(function (result, id) {
        return result || messages[id] || enums[id]
      }, null)

    if (compile === false) return m
    if (!m) throw new Error('Could not resolve ' + name)

    if (m.values) return compileEnum(m)
    var res = cache[m.id] || compileMessage(m, cache[m.id] = {})
    return res
  }

  return (schema.enums || []).concat((schema.messages || []).map(function (message) {
    return resolve(message.id)
  }))
}
