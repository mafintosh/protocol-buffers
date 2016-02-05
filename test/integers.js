var tape = require('tape')
var fs = require('fs')
var protobuf = require('../')
var Integers = protobuf(fs.readFileSync(__dirname + '/test.proto')).Integers

tape('integers encode + decode', function (t) {
  var b1 = Integers.encode({
    sint32: 1,
    sint64: 2,
    int32: 3,
    uint32: 4,
    int64: 5
  })

  var o1 = Integers.decode(b1)

  t.same(o1, {
    sint32: 1,
    sint64: 2,
    int32: 3,
    uint32: 4,
    int64: 5
  })

  t.end()
})

tape('integers encode + decode + negative', function (t) {
  var b1 = Integers.encode({
    sint32: -1,
    sint64: -2,
    int32: -3,
    uint32: 0,
    int64: -1 * Math.pow(2, 52) - 5
  })

  var o1 = Integers.decode(b1)

  t.same(o1, {
    sint32: -1,
    sint64: -2,
    int32: -3,
    uint32: 0,
    int64: -1 * Math.pow(2, 52) - 5
  })

  t.end()
})
