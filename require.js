var fs = require('fs')
var path = require('path')
var protobuf = require('./')

delete require.cache[require.resolve(__filename)]

module.exports = function(file) {
  var parent = path.dirname(module.parent.filename)
  if (!fs.existsSync(file) && fs.existsSync(file+'.proto')) file += '.proto'
  return protobuf(fs.readFileSync(file, 'utf-8'))
}
