var schema = require('protobuf-schema')
var compile = require('./compile')

module.exports = function(proto) {
  if (!proto) throw new Error('Pass in a .proto string or a protobuf-schema parsed object')

  var sch = (typeof proto === 'object' && !Buffer.isBuffer(proto)) ? proto : schema.parse(proto)
  var that = {}

  compile(sch).forEach(function(m) {
    that[m.name] = m.values || m
  })

  that.toString = function() {
    return schema.stringify(sch)
  }

  that.toJSON = function() {
    return sch
  }

  return that
}