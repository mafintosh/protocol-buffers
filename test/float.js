var tape = require('tape')
var path = require('path')
var fs = require('fs')
var protobuf = require('../')
var Float = protobuf(fs.readFileSync(__dirname + '/test.proto')).Float

tape('float encode + decode', function(t) {
  var arr = new Float32Array(3)
  arr[0] = 1.1
  arr[1] = 0
  arr[2] = -2.3
  
  var obj = {
    float1: arr[0],
    float2: arr[1],
    float3: arr[2]
  }
  
  var b1 = Float.encode(obj)

  var o1 = Float.decode(b1)

  t.same(o1, obj)

  t.end()
})
