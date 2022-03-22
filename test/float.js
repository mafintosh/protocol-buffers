const tape = require('tape')
const Float = require('./helpers/messages').Float

tape('float encode + decode', function (t) {
  const arr = new Float32Array(3)
  arr[0] = 1.1
  arr[1] = 0
  arr[2] = -2.3

  const obj = {
    float1: arr[0],
    float2: arr[1],
    float3: arr[2]
  }

  const b1 = Float.encode(obj)

  const o1 = Float.decode(b1)

  t.same(o1, obj)

  t.end()
})
