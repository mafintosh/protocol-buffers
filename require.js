// TODO: this should be removed in 3.0.0 - just use the two modules instead
var resolve = require('resolve-protobuf-schema')
var path = require('path')
var protobuf = require('./')

delete require.cache[require.resolve(__filename)]

module.exports = function(filename, opts) {
  return protobuf(resolve.sync(path.resolve(path.dirname(module.parent.filename), filename)), opts)
}
