var tape = require('tape')
var path = require('path')
var fs = require('fs')
var protobuf = require('../')
var Repeated = protobuf(fs.readFileSync(__dirname + '/test.proto')).Repeated

tape('repeated encode', function(t) {
  var b1 = Repeated.encode({
    list: [{
      num: 1,
      payload: new Buffer('lol')
    }, {
      num: 2,
      payload: new Buffer('lol1')
    }]
  })

  var b2 = Repeated.encode({
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

tape('repeated encode + decode', function(t) {
  var b1 = Repeated.encode({
    list: [{
      num: 1,
      payload: new Buffer('lol')
    }, {
      num: 2,
      payload: new Buffer('lol1')
    }]
  })

  var o1 = Repeated.decode(b1)

  t.same(o1.list.length, 2)
  t.same(o1.list[0].num, 1)
  t.same(o1.list[0].payload, new Buffer('lol'))
  t.same(o1.list[1].num, 2)
  t.same(o1.list[1].payload, new Buffer('lol1'))

  var b2 = Repeated.encode({
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

  var o2 = Repeated.decode(b1)

  t.same(o2, o1)
  t.end()
})
