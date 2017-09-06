'use strict'

var tape = require('tape')
var fs = require('fs')
var protobufNpm = require('protocol-buffers')
var protobuf = require('../')
var path = require('path')
var proto = fs.readFileSync(path.join(__dirname, '/test.proto'))
var Basic = protobuf(proto).Basic
var BasicNpm = protobufNpm(proto).Basic

tape('basic encode', function (t) {
  var first = {
    num: 1,
    payload: Buffer.from('lol')
  }

  var b1 = Basic.encode(first)

  var bn1 = BasicNpm.encode(first)

  t.same(b1, bn1)

  var b2 = Basic.encode({
    num: 1,
    payload: Buffer.from('lol'),
    meeeh: 42
  })

  var b3 = Basic.encode({
    num: 1,
    payload: 'lol',
    meeeh: 42
  })

  t.same(b2, b1)
  t.same(b3, b1)
  t.end()
})

tape('basic encode + decode', function (t) {
  var b1 = Basic.encode({
    num: 1,
    payload: Buffer.from('lol')
  })

  var o1 = Basic.decode(b1)

  t.same(o1.num, 1)
  t.same(o1.payload, Buffer.from('lol'))

  var b2 = Basic.encode({
    num: 1,
    payload: Buffer.from('lol'),
    meeeh: 42
  })

  var o2 = Basic.decode(b2)

  t.same(o2, o1)
  t.end()
})

tape('basic encode + decode floats', function (t) {
  var b1 = Basic.encode({
    num: 1.1,
    payload: Buffer.from('lol')
  })

  var o1 = Basic.decode(b1)

  t.same(o1.num, 1.1)
  t.same(o1.payload, Buffer.from('lol'))
  t.end()
})
