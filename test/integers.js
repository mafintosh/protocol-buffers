var tape = require('tape')
var path = require('path')
var protobuf = require('../require')
var Integers = protobuf('./test.proto').Integers

tape('integers encode + decode', function(t) {
  var b1 = Integers.encode({
    sint32: 1,
    sint64: 2,
    int32: 3,
    uint32: 4
  })

  var o1 = Integers.decode(b1)

  t.same(o1, {
    sint32: 1,
    sint64: 2,
    int32: 3,
    uint32: 4
  })

  t.end()
})

tape('integers encode + decode + negative', function(t) {
  var b1 = Integers.encode({
    sint32: -1,
    sint64: -2,
    int32: -3
  })

  var o1 = Integers.decode(b1)

  t.same(o1, {
    sint32: -1,
    sint64: -2,
    int32: -3
  })

  t.end()
})
