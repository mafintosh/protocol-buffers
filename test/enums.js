const tape = require('tape')
const messages = require('./helpers/messages')

tape('enums', function (t) {
  const e = messages.FOO

  t.same(e, { A: 1, B: 2 }, 'enum is defined')
  t.end()
})

tape('hex enums', function (t) {
  const e = messages.FOO_HEX

  t.same(e, { A: 1, B: 2 }, 'enum is defined using hex')
  t.end()
})
