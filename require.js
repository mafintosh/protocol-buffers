var fs = require('fs')
var path = require('path')
var protobuf = require('./')

delete require.cache[require.resolve(__filename)]

module.exports = function(file) {
  file = path.join(path.dirname(module.parent.filename), file)
  if (!fs.existsSync(file) && fs.existsSync(file+'.proto')) file += '.proto'
  return protobuf(fs.readFileSync(file, 'utf-8'))
}
