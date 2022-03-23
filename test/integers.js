const tape = require('tape')
const Integers = require('./helpers/messages').Integers

tape('integers encode + decode', function (t) {
  const b1 = Integers.encode({
    sint32: 1,
    sint64: 2,
    int32: 3,
    uint32: 4,
    int64: 5
  })

  const o1 = Integers.decode(b1)

  t.same(o1, {
    sint32: 1,
    sint64: 2,
    int32: 3,
    uint32: 4,
    int64: 5
  })

  t.end()
})

tape('integers encode + decode + negative', function (t) {
  const b1 = Integers.encode({
    sint32: -1,
    sint64: -2,
    int32: -3,
    uint32: 0,
    int64: -1 * Math.pow(2, 52) - 5
  })

  const o1 = Integers.decode(b1)

  t.same(o1, {
    sint32: -1,
    sint64: -2,
    int32: -3,
    uint32: 0,
    int64: -1 * Math.pow(2, 52) - 5
  })

  t.end()
})
