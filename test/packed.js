var tape = require('tape')
var Packed = require('./helpers/messages').Packed

tape('Packed encode', function (t) {
  var b1 = Packed.encode({
    packed: [
      10,
      42,
      52
    ]
  })

  var b2 = Packed.encode({
    packed: [
      10,
      42,
      52
    ],
    meeh: 42
  })

  t.same(b2, b1)
  t.end()
})

tape('Packed encode + decode', function (t) {
  var b1 = Packed.encode({
    packed: [
      10,
      42,
      52
    ]
  })

  var o1 = Packed.decode(b1)

  t.same(o1.packed.length, 3)
  t.same(o1.packed[0], 10)
  t.same(o1.packed[1], 42)
  t.same(o1.packed[2], 52)

  var b2 = Packed.encode({
    packed: [
      10,
      42,
      52
    ],
    meeh: 42
  })

  var o2 = Packed.decode(b2)

  t.same(o2, o1)
  t.end()
})

tape('packed message encode', function (t) {
  var b1 = Packed.encode({
    list: [{
      num: 1,
      payload: Buffer.from('lol')
    }, {
      num: 2,
      payload: Buffer.from('lol1')
    }]
  })

  var b2 = Packed.encode({
    list: [{
      num: 1,
      payload: Buffer.from('lol')
    }, {
      num: 2,
      payload: Buffer.from('lol1'),
      meeeeh: 100
    }],
    meeh: 42
  })

  t.same(b2, b1)
  t.end()
})

tape('packed message encode + decode', function (t) {
  var b1 = Packed.encode({
    list: [{
      num: 1,
      payload: Buffer.from('lol')
    }, {
      num: 2,
      payload: Buffer.from('lol1')
    }]
  })

  var o1 = Packed.decode(b1)

  t.same(o1.list.length, 2)
  t.same(o1.list[0].num, 1)
  t.same(o1.list[0].payload, Buffer.from('lol'))
  t.same(o1.list[1].num, 2)
  t.same(o1.list[1].payload, Buffer.from('lol1'))

  var b2 = Packed.encode({
    list: [{
      num: 1,
      payload: Buffer.from('lol')
    }, {
      num: 2,
      payload: Buffer.from('lol1'),
      meeeeh: 100
    }],
    meeh: 42
  })

  var o2 = Packed.decode(b2)

  t.same(o2, o1)
  t.end()
})
