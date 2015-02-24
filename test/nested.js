var tape = require('tape')
var path = require('path')
var fs = require('fs')
var protobuf = require('../')
var Nested = protobuf(fs.readFileSync(__dirname + '/test.proto')).Nested

tape('nested encode', function(t) {
  var b1 = Nested.encode({
    num: 1,
    payload: new Buffer('lol'),
    meh: {
      num: 2,
      payload: new Buffer('bar')
    }
  })

  var b2 = Nested.encode({
    num: 1,
    payload: new Buffer('lol'),
    meeeh: 42,
    meh: {
      num: 2,
      payload: new Buffer('bar')
    }
  })

  t.same(b2, b1)
  t.end()
})

tape('nested encode + decode', function(t) {
  var b1 = Nested.encode({
    num: 1,
    payload: new Buffer('lol'),
    meh: {
      num: 2,
      payload: new Buffer('bar')
    }
  })

  var o1 = Nested.decode(b1)

  t.same(o1.num, 1)
  t.same(o1.payload, new Buffer('lol'))
  t.ok(o1.meh, 'has nested property')
  t.same(o1.meh.num, 2)
  t.same(o1.meh.payload, new Buffer('bar'))

  var b2 = Nested.encode({
    num: 1,
    payload: new Buffer('lol'),
    meeeh: 42,
    meh: {
      num: 2,
      payload: new Buffer('bar')
    }
  });

  var o2 = Nested.decode(b1)

  t.same(o2, o1)
  t.end()
})
