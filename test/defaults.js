var tape = require('tape')
var Defaults = require('./helpers/messages').Defaults

tape('defaults decode', function (t) {
  var o1 = Defaults.decode(Buffer.alloc(0)) // everything default

  var b2 = Defaults.encode({
    num: 10,
    foos: [1]
  })

  var b3 = Defaults.encode({
    num: 10,
    foo2: 2
  })

  t.same(Defaults.decode(b3), {
    num: 10,
    foo1: 2,
    foo2: 2,
    foos: [],
    float_value: 4.932,
    double_value: 1.2322
  }, '1 default')

  t.same(o1, {
    num: 42,
    foo1: 2,
    foo2: 1,
    foos: [],
    float_value: 4.932,
    double_value: 1.2322
  }, 'all defaults')

  t.same(Defaults.decode(b2), {
    num: 10,
    foo1: 2,
    foo2: 1,
    foos: [1],
    float_value: 4.932,
    double_value: 1.2322
  }, '2 defaults')

  t.end()
})
