const tape = require('tape')
const Repeated = require('./helpers/messages').Repeated

tape('repeated encode', function (t) {
  const b1 = Repeated.encode({
    list: [{
      num: 1,
      payload: Buffer.from('lol')
    }, {
      num: 2,
      payload: Buffer.from('lol1')
    }]
  })

  const b2 = Repeated.encode({
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

tape('repeated encode + decode', function (t) {
  const b1 = Repeated.encode({
    list: [{
      num: 1,
      payload: Buffer.from('lol')
    }, {
      num: 2,
      payload: Buffer.from('lol1')
    }]
  })

  const o1 = Repeated.decode(b1)

  t.same(o1.list.length, 2)
  t.same(o1.list[0].num, 1)
  t.same(o1.list[0].payload, Buffer.from('lol'))
  t.same(o1.list[1].num, 2)
  t.same(o1.list[1].payload, Buffer.from('lol1'))

  const b2 = Repeated.encode({
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

  const o2 = Repeated.decode(b2)

  t.same(o2, o1)
  t.end()
})
