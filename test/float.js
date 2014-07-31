var tape = require('tape')
var path = require('path')
var protobuf = require('../require')
var Float = protobuf('./test.proto').Float

tape('integers encode + decode', function(t) {
  var b1 = Float.encode({
    float: 1.1
  })

  var o1 = Float.decode(b1)

  t.same(o1, {
    float: 1.1
  })

  t.end()
})

tape('integers encode + decode + negative', function(t) {
  var b1 = Float.encode({
    float: 0,
    float2: -1.1
  })

  var o1 = Float.decode(b1)

  t.same(o1, {
    float: 0,
    float2: -1.1
  })

  t.end()
})