var fs = require('fs')
var path = require('path')
var schema = require('protobuf-schema')
var protobuf = require('./')

delete require.cache[require.resolve(__filename)]

var importSchema = function(filename) {
  if (!fs.existsSync(filename) && fs.existsSync(filename+'.proto')) filename += '.proto'

  var dir = path.dirname(filename)
  var sch = schema(fs.readFileSync(filename, 'utf-8'))

  if (!sch.imports || !sch.imports.length) return sch

  sch.imports.forEach(function(i) {
    var ch = importSchema(path.join(dir, i))
    sch.messages = sch.messages.concat(ch.messages)
    sch.enums = sch.enums.concat(ch.enums)
  })

  return sch
}

module.exports = function(filename, opts) {
  var dir = path.dirname(module.parent.filename)
  var sch = importSchema(path.join(path.dirname(module.parent.filename), filename))
  return protobuf(sch, opts)
}
