var encodings = require('./encodings')
var varint = require('varint')

var defined = function(val) {
  return val !== null && val !== undefined
}

var compileEnum = function(e) {
  var values = Object.keys(e.values).map(function(k) {
    return e.values[k]
  })

  var encode = function(val, buf, offset) {
    if (values.indexOf(val) === -1) throw new Error('Invalid enum value: '+val)
    var result = varint.encode(val, buf, offset)
    encode.bytes = varint.encode.bytes
    return result
  }

  var decode = function(buf, offset) {
    var result = varint.decode(buf, offset)
    if (values.indexOf(result) === -1) throw new Error('Invalid enum value: '+val)
    decode.bytes = varint.decode.bytes
    return result
  }

  return encodings.make(0, encode, decode, varint.encodingLength)
}

module.exports = function(schema) {
  var messages = {}
  var enums = {}
  var cache = {}

  var visit = function(schema, prefix) {
    if (schema.enums) {
      schema.enums.forEach(function(e) {
        e.id = prefix + (prefix ? '.' : '')+e.name
        enums[e.id] = e
        visit(e, e.id)
      })
    }
    if (schema.messages) {
      schema.messages.forEach(function(m) {
        m.id = prefix + (prefix ? '.' : '')+m.name
        messages[m.id] = m
        visit(m, m.id)
      })
    }
  }

  visit(schema, '')

  var compile = function(m) {
    var index = []
    var headers = []

    var enc = m.fields.map(function(f, i) {
      var e = resolve(f.type, m.id)
      headers[i] = new Buffer(varint.encode(f.tag << 3 | e.type))
      index[f.tag] = [e, f]
      return e
    })

    var encode = function(obj, buf, offset) {
      if (!offset) offset = 0
      if (!buf) buf = new Buffer(encodingLength(obj))

      var oldOffset = offset

      for (var i = 0; i < enc.length; i++) {
        var f = m.fields[i]
        var h = headers[i]
        var e = enc[i]

        var val = obj[f.name]

        if (!defined(val)) {
          if (f.required) throw new Error(f.name+' is required')
          continue
        }

        if (f.repeated) {
          for (var i = 0; i < val.length; i++) {
            if (!defined(val[i])) continue

            h.copy(buf, offset)
            offset += h.length

            if (e.message) {
              varint.encode(e.encodingLength(val[i]), buf, offset)
              offset += varint.encode.bytes
            }

            e.encode(val[i], buf, offset)
            offset += e.encode.bytes
          }
        } else {
          h.copy(buf, offset)
          offset += h.length

          if (e.message) {
            varint.encode(e.encodingLength(val), buf, offset)
            offset += varint.encode.bytes
          }

          e.encode(val, buf, offset)
          offset += e.encode.bytes
        }

      }

      encode.bytes = offset - oldOffset

      return buf
    }

    var decode = function(buf, offset, end) {
      if (!offset) offset = 0
      if (!end) end = buf.length

      var oldOffset = offset
      var obj = {}

      while (true) {
        if (end <= offset) {
          decode.bytes = offset - oldOffset
          return obj
        }

        var prefix = varint.decode(buf, offset)
        offset += varint.decode.bytes

        var type = prefix & 0x7
        var tag = prefix >> 3

        var pair = index[tag]
        if (!pair) throw new Error('No decoder found for tag '+tag)

        var e = pair[0]
        var f = pair[1]

        var tmp

        if (e.message) {
          var len = varint.decode(buf, offset)
          offset += varint.decode.bytes
          tmp = e.decode(buf, offset, offset + len)
        } else {
          tmp = e.decode(buf, offset)
        }

        offset += e.decode.bytes

        if (f.repeated) {
          if (!obj[f.name]) obj[f.name] = []
          obj[f.name].push(tmp)
        } else {
          obj[f.name] = tmp
        }
      }
    }

    var encodingLength = function(obj) {
      var length = 0

      for (var i = 0; i < enc.length; i++) {
        var f = m.fields[i]
        var h = headers[i]
        var e = enc[i]

        var val = obj[f.name]

        if (!defined(val)) {
          if (f.required) throw new Error(f.name+' is required')
          continue
        }

        if (f.repeated) {
          for (var i = 0; i < val.length; i++) {
            if (!defined(val[i])) continue
            var len = e.encodingLength(val[i])
            if (e.message) length += varint.encodingLength(len)
            length += h.length + len
          }
        } else {
          var len = e.encodingLength(val)
          if (e.message) length += varint.encodingLength(len)
          length += h.length + len
        }
      }

      return length
    }

    encode.bytes = decode.bytes = 0

    return {
      type: 2,
      message: true,
      name: m.name,
      encode: encode,
      decode: decode,
      encodingLength: encodingLength
    }
  }

  var resolve = function(name, from) {
    if (encodings[name]) return encodings[name]

    var m = (from ? from+'.'+name : name).split('.')
      .map(function(part, i, list) {
        return list.slice(0, i).concat(name).join('.')
      })
      .reverse()
      .reduce(function(result, id) {
        return result || messages[id] || enums[id]
      }, null)

    if (!m) throw new Error('Could not resolve '+name)

    if (m.values) return compileEnum(m)
    return cache[m.id] || (cache[m.id] = compile(m))
  }

  return schema.enums.concat(schema.messages.map(function(message) {
    return resolve(message.id)
  }))
}