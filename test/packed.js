var tape = require('tape')
var path = require('path')
var fs = require('fs')
var protobuf = require('../')
var Packed = protobuf(fs.readFileSync(__dirname + '/test.proto')).Packed

tape('Packed encode', function(t) {
  var b1 = Packed.encode({
    packed: [
      'hello world',
      'hej verden',
      'hola mundo'
    ]
  })

  var b2 = Packed.encode({
    packed: [
      'hello world',
      'hej verden',
      'hola mundo'
    ],
    meeh: 42
  })

  t.same(b2, b1)
  t.end()
})

tape('Packed encode + decode', function(t) {
  var b1 = Packed.encode({
    packed: [
      'hello world',
      'hej verden',
      'hola mundo'
    ]
  })

  var o1 = Packed.decode(b1)

  t.same(o1.packed.length, 3)
  t.same(o1.packed[0], 'hello world')
  t.same(o1.packed[1], 'hej verden')
  t.same(o1.packed[2], 'hola mundo')

  var b2 = Packed.encode({
    packed: [
      'hello world',
      'hej verden',
      'hola mundo'
    ],
    meeh: 42
  })

  var o2 = Packed.decode(b1)

  t.same(o2, o1)
  t.end()
})


tape('packed message encode', function(t) {
  var b1 = Packed.encode({
    list: [{
      num: 1,
      payload: new Buffer('lol')
    }, {
      num: 2,
      payload: new Buffer('lol1')
    }]
  })

  var b2 = Packed.encode({
    list: [{
      num: 1,
      payload: new Buffer('lol')
    }, {
      num: 2,
      payload: new Buffer('lol1'),
      meeeeh: 100
    }],
    meeh: 42
  })

  t.same(b2, b1)
  t.end()
})

tape('packed message encode + decode', function(t) {
  var b1 = Packed.encode({
    list: [{
      num: 1,
      payload: new Buffer('lol')
    }, {
      num: 2,
      payload: new Buffer('lol1')
    }]
  })

  var o1 = Packed.decode(b1)

  t.same(o1.list.length, 2)
  t.same(o1.list[0].num, 1)
  t.same(o1.list[0].payload, new Buffer('lol'))
  t.same(o1.list[1].num, 2)
  t.same(o1.list[1].payload, new Buffer('lol1'))

  var b2 = Packed.encode({
    list: [{
      num: 1,
      payload: new Buffer('lol')
    }, {
      num: 2,
      payload: new Buffer('lol1'),
      meeeeh: 100
    }],
    meeh: 42
  })

  var o2 = Packed.decode(b1)

  t.same(o2, o1)
  t.end()
})
