const tape = require('tape')
const Nested = require('./helpers/messages').Nested

tape('nested encode', function (t) {
  const b1 = Nested.encode({
    num: 1,
    payload: Buffer.from('lol'),
    meh: {
      num: 2,
      payload: Buffer.from('bar')
    }
  })

  const b2 = Nested.encode({
    num: 1,
    payload: Buffer.from('lol'),
    meeeh: 42,
    meh: {
      num: 2,
      payload: Buffer.from('bar')
    }
  })

  t.same(b2, b1)
  t.end()
})

tape('nested encode + decode', function (t) {
  const b1 = Nested.encode({
    num: 1,
    payload: Buffer.from('lol'),
    meh: {
      num: 2,
      payload: Buffer.from('bar')
    }
  })

  const o1 = Nested.decode(b1)

  t.same(o1.num, 1)
  t.same(o1.payload, Buffer.from('lol'))
  t.ok(o1.meh, 'has nested property')
  t.same(o1.meh.num, 2)
  t.same(o1.meh.payload, Buffer.from('bar'))

  const b2 = Nested.encode({
    num: 1,
    payload: Buffer.from('lol'),
    meeeh: 42,
    meh: {
      num: 2,
      payload: Buffer.from('bar')
    }
  })

  const o2 = Nested.decode(b2)

  t.same(o2, o1)
  t.end()
})
