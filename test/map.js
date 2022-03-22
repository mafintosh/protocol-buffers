const tape = require('tape')
const Map = require('./helpers/messages').Map

tape('map encode + decode', function (t) {
  const b1 = Map.encode({
    foo: {
      hello: 'world'
    }
  })

  const o1 = Map.decode(b1)

  t.same(o1.foo, { hello: 'world' })

  const doc = {
    foo: {
      hello: 'world',
      hi: 'verden'
    }
  }

  const b2 = Map.encode(doc)
  const o2 = Map.decode(b2)

  t.same(o2, doc)
  t.end()
})
