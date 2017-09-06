'use strict'

var tape = require('tape')
var fs = require('fs')
var path = require('path')
var protobuf = require('../')
var Map = protobuf(fs.readFileSync(path.join(__dirname, '/test.proto'))).Map

tape('map encode + decode', function (t) {
  var b1 = Map.encode({
    foo: {
      hello: 'world'
    }
  })

  var o1 = Map.decode(b1)

  t.same(o1.foo, {hello: 'world'})

  var doc = {
    foo: {
      hello: 'world',
      hi: 'verden'
    }
  }

  var b2 = Map.encode(doc)
  var o2 = Map.decode(b2)

  t.same(o2, doc)
  t.end()
})
