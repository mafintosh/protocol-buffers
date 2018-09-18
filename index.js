var schema = require('protocol-buffers-schema')
var compile = require('./compile')
var compileToJS = require('./compile-to-js')

var flatten = function (values) {
  if (!values) return null
  var result = {}
  Object.keys(values).forEach(function (k) {
    result[k] = values[k].value
  })
  return result
}

module.exports = function (proto, opts) {
  if (!opts) opts = {}
  if (!proto) throw new Error('Pass in a .proto string or a protobuf-schema parsed object')

  var sch = (typeof proto === 'object' && !Buffer.isBuffer(proto)) ? proto : schema.parse(proto)

  // to not make toString,toJSON enumarable we make a fire-and-forget prototype
  var Messages = function () {
    var self = this

    compile(sch, opts.encodings || {}).forEach(function (m) {
      self[m.name] = flatten(m.values) || m
    })
  }

  Messages.prototype.toString = function () {
    return schema.stringify(sch)
  }

  Messages.prototype.toJSON = function () {
    return sch
  }

  return new Messages()
}

module.exports.toJS = function (proto) {
  return compileToJS(module.exports(proto))
}
