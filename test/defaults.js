var tape = require('tape')
var protobuf = require('../require')
var Defaults = protobuf('./test.proto').Defaults

tape('defaults decode', function(t) {
  var o1 = Defaults.decode(new Buffer(0)) // everything default

  var b2 = Defaults.encode({
    num: 10
  })

  var b3 = Defaults.encode({
    num: 10,
    foo2: 2
  })

  t.same(Defaults.decode(b3), {
    num: 10,
    foo1: 2,
    foo2: 2
  }, '1 default')

  t.same(o1, {
    num: 42,
    foo1: 2,
    foo2: 1
  }, 'all defaults')

  t.same(Defaults.decode(b2), {
    num: 10,
    foo1: 2,
    foo2: 1
  }, '2 defaults')

  t.end()
})
