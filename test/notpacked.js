var tape = require('tape')
var fs = require('fs')
var protobuf = require('../')
var NotPacked = protobuf(fs.readFileSync(__dirname + '/test.proto')).NotPacked
var FalsePacked = protobuf(fs.readFileSync(__dirname + '/test.proto')).FalsePacked

tape('NotPacked encode + FalsePacked decode', function (t) {
  var b1 = NotPacked.encode({
    id: [ 9847136125 ],
    value: 10000
  })

  var o1 = FalsePacked.decode(b1)

  t.same(o1.id.length, 1)
  t.same(o1.id[0], 9847136125)

  t.end()
})

tape('FalsePacked encode + NotPacked decode', function (t) {
  var b1 = FalsePacked.encode({
    id: [ 9847136125 ],
    value: 10000
  })

  var o1 = NotPacked.decode(b1)

  t.same(o1.id.length, 1)
  t.same(o1.id[0], 9847136125)

  t.end()
})
