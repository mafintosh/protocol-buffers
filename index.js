const schema = require('protocol-buffers-schema')
const compile = require('./compile')
const compileToJS = require('./compile-to-js')

const flatten = function (values) {
  if (!values) return null
  const result = {}
  Object.keys(values).forEach(function (k) {
    result[k] = values[k].value
  })
  return result
}

module.exports = function (proto, opts) {
  if (!opts) opts = {}
  if (!proto) throw new Error('Pass in a .proto string or a protobuf-schema parsed object')

  const sch = (typeof proto === 'object' && !Buffer.isBuffer(proto)) ? proto : schema.parse(proto)

  // to not make toString,toJSON enumarable we make a fire-and-forget prototype
  const Messages = function () {
    const self = this

    compile(sch, opts.encodings || {}, opts.inlineEnc).forEach(function (m) {
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

module.exports.toJS = function (proto, opts) {
  return compileToJS(module.exports(proto, { inlineEnc: true }), opts)
}
