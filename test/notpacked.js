'use strict'

var tape = require('tape')
var fs = require('fs')
var path = require('path')
var protobuf = require('../')
var proto = fs.readFileSync(path.join(__dirname, '/test.proto'))
var NotPacked = protobuf(proto).NotPacked
var FalsePacked = protobuf(proto).FalsePacked

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
