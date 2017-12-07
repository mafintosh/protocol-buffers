'use strict'

var tape = require('tape')
var fs = require('fs')
var path = require('path')
var protobuf = require('../')
var Packed = protobuf(fs.readFileSync(path.join(__dirname, '/test.proto'))).Packed

tape('Packed encode', function (t) {
  var b1 = Packed.encode({
    packed: [
      12,
      13,
      14
    ]
  })

  var b2 = Packed.encode({
    packed: [
      12,
      13,
      14
    ],
    meeh: 42
  })

  t.same(b2, b1)
  t.end()
})

tape('Packed encode + decode', function (t) {
  var b1 = Packed.encode({
    packed: [
      12,
      13,
      14
    ]
  })

  var o1 = Packed.decode(b1)

  t.same(o1.packed.length, 3)
  t.same(o1.packed[0], 12)
  t.same(o1.packed[1], 13)
  t.same(o1.packed[2], 14)

  var b2 = Packed.encode({
    packed: [
      12,
      13,
      14
    ],
    meeh: 42
  })

  var o2 = Packed.decode(b2)

  t.same(o2, o1)
  t.end()
})
