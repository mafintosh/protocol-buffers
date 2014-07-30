var tape = require('tape')
var path = require('path')
var protobuf = require('../require')
var Basic = protobuf('./test.proto').Basic

tape('basic encode', function(t) {
  var b1 = Basic.encode({
    num: 1,
    payload: new Buffer('lol')
  })

  var b2 = Basic.encode({
    num: 1,
    payload: new Buffer('lol'),
    meeeh: 42
  })

  t.same(b2, b1)
  t.end()
})

tape('basic encode + decode', function(t) {
  var b1 = Basic.encode({
    num: 1,
    payload: new Buffer('lol')
  })

  var o1 = Basic.decode(b1)

  t.same(o1.num, 1)
  t.same(o1.payload, new Buffer('lol'))

  var b2 = Basic.encode({
    num: 1,
    payload: new Buffer('lol'),
    meeeh: 42
  })

  var o2 = Basic.decode(b1)

  t.same(o2, o1)
  t.end()
})

tape('basic encode + decode floats', function(t) {
  var b1 = Basic.encode({
    num: 1.1,
    payload: new Buffer('lol')
  })

  var o1 = Basic.decode(b1)

  t.same(o1.num, 1.1)
  t.same(o1.payload, new Buffer('lol'))
  t.end()
})