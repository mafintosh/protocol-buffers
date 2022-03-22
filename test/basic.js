const tape = require('tape')
const Basic = require('./helpers/messages').Basic

tape('basic encode', function (t) {
  const b1 = Basic.encode({
    num: 1,
    payload: Buffer.from('lol')
  })

  const b2 = Basic.encode({
    num: 1,
    payload: Buffer.from('lol'),
    meeeh: 42
  })

  const b3 = Basic.encode({
    num: 1,
    payload: 'lol',
    meeeh: 42
  })

  t.same(b2, b1)
  t.same(b3, b1)
  t.end()
})

tape('basic encode + decode', function (t) {
  const b1 = Basic.encode({
    num: 1,
    payload: Buffer.from('lol')
  })

  const o1 = Basic.decode(b1)

  t.same(o1.num, 1)
  t.same(o1.payload, Buffer.from('lol'))

  const b2 = Basic.encode({
    num: 1,
    payload: Buffer.from('lol'),
    meeeh: 42
  })

  const o2 = Basic.decode(b2)

  t.same(o2, o1)
  t.end()
})

tape('basic encode + decode floats', function (t) {
  const b1 = Basic.encode({
    num: 1.1,
    payload: Buffer.from('lol')
  })

  const o1 = Basic.decode(b1)

  t.same(o1.num, 1.1)
  t.same(o1.payload, Buffer.from('lol'))
  t.end()
})
