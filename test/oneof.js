var tape = require('tape')
var proto = require('./helpers/messages')
var Property = proto.Property
var PropertyNoOneof = proto.PropertyNoOneof

var data = {
  name: 'Foo',
  desc: 'optional description',
  int_value: 12345
}

tape('oneof encode', function (t) {
  t.ok(Property.encode(data), 'oneof encode')
  t.end()
})

tape('oneof encode + decode', function (t) {
  var buf = Property.encode(data)
  var out = Property.decode(buf)
  t.deepEqual(data, out)
  t.end()
})

tape('oneof encode of overloaded json throws', function (t) {
  var invalidData = {
    name: 'Foo',
    desc: 'optional description',
    string_value: 'Bar', // ignored
    bool_value: true, // ignored
    int_value: 12345 // retained, was last entered
  }
  try {
    Property.encode(invalidData)
  } catch (err) {
    t.ok(true, 'should throw')
    t.end()
  }
})

tape('oneof encode + decode of overloaded oneof buffer', function (t) {
  var invalidData = {
    name: 'Foo',
    desc: 'optional description',
    string_value: 'Bar', // retained, has highest tag number
    bool_value: true, // ignored
    int_value: 12345 // ignored
  }
  var validData = {
    name: 'Foo',
    desc: 'optional description',
    string_value: 'Bar'
  }

  var buf = PropertyNoOneof.encode(invalidData)
  var out = Property.decode(buf)
  t.deepEqual(validData, out)
  t.end()
})
