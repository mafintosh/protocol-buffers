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

function resolveImport (filename, opts, context) {
  if (!opts.resolveImport) throw new Error('opts.resolveImport is required if opts.filename is given.')
  return _resolveImport(filename, opts, context)
}

function _resolveImport (filename, opts, context) {
  if (context.stack.has(filename)) {
    throw new Error('File recursively imports itself: ' + Array.from(context.stack).concat(filename).join(' -> '))
  }
  context.stack.add(filename)
  const importData = opts.resolveImport(filename)
  const sch = (typeof importData === 'object' && !Buffer.isBuffer(importData)) ? importData : schema.parse(importData)
  sch.imports.forEach(function (importDef) {
    const imported = _resolveImport(importDef, opts, context)
    sch.enums = sch.enums.concat(imported.enums)
    sch.messages = sch.messages.concat(imported.messages)
  })
  context.stack.delete(filename)
  return sch
}

module.exports = function (proto, opts) {
  if (!opts) opts = {}
  let sch
  if (opts.filename) {
    sch = resolveImport(opts.filename, opts, {
      cache: {},
      stack: new Set()
    })
  } else {
    if (!proto) throw new Error('Pass in a .proto string or a protobuf-schema parsed object')
    sch = (typeof proto === 'object' && !Buffer.isBuffer(proto)) ? proto : schema.parse(proto)
  }

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
  return compileToJS(module.exports(proto, Object.assign({ inlineEnc: true }, opts)), opts)
}
