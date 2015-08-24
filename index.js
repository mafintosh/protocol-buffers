var schema = require('protocol-buffers-schema')
var compile = require('./compile')

module.exports = function(proto, opts) {
  if (!opts) opts = {}
  if (!proto) throw new Error('Pass in a .proto string or a protobuf-schema parsed object')

  var sch = (typeof proto === 'object' && !Buffer.isBuffer(proto)) ? proto : schema.parse(proto)
  var importedFiles = {}
  var extraEncodings = opts.encodings || {}
    
    
  var visit = function(schema, prefix) {
    if (schema.enums) {
      schema.enums.forEach(function (e) {
        e.id = prefix + (prefix ? '.' : '') + e.name
        extraEncodings[e.id] = e
        visit(e, e.id)
      })
    }
    if (schema.messages) {
      schema.messages.forEach(function (m) {
        m.id = prefix + (prefix ? '.' : '') + m.name
        extraEncodings[m.id] = m
        visit(m, m.id)
      })
    }
  }
  var processImport = function(proto, isImport) {
    var sch = (typeof proto === 'object' && !Buffer.isBuffer(proto)) ? proto : schema.parse(proto)
    sch.imports.forEach(function(filename) {
      if (importedFiles.hasOwnProperty(filename)) return
      if (typeof opts.resolveImport !== 'function') throw new Error('.proto requires import, but resolveImport function not provided.')
      processImport(opts.resolveImport(filename), true)
      importedFiles[filename] = 1
    })
    if (isImport === true) visit(sch, sch.package !== null ? sch.package : '')
  }

  // to not make toString,toJSON enumarable we make a fire-and-forget prototype
  var Messages = function() {
    var self = this

    processImport(sch)
    compile(sch, extraEncodings).forEach(function (m) {
      self[m.name] = m.values || m
    })
  }

  Messages.prototype.toString = function() {
    return schema.stringify(sch)
  }

  Messages.prototype.toJSON = function() {
    return sch
  }

  return new Messages()
}
