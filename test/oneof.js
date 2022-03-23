const tape = require('tape')
const proto = require('./helpers/messages')
const Property = proto.Property
const PropertyNoOneof = proto.PropertyNoOneof

const data = {
  name: 'Foo',
  desc: 'optional description',
  int_value: 12345
}

tape('oneof encode', function (t) {
  t.ok(Property.encode(data), 'oneof encode')
  t.end()
})

tape('oneof encode + decode', function (t) {
  const buf = Property.encode(data)
  const out = Property.decode(buf)
  t.deepEqual(data, out)
  t.end()
})

tape('oneof encode of overloaded json throws', function (t) {
  const invalidData = {
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
  const invalidData = {
    name: 'Foo',
    desc: 'optional description',
    string_value: 'Bar', // retained, has highest tag number
    bool_value: true, // ignored
    int_value: 12345 // ignored
  }
  const validData = {
    name: 'Foo',
    desc: 'optional description',
    string_value: 'Bar'
  }

  const buf = PropertyNoOneof.encode(invalidData)
  const out = Property.decode(buf)
  t.deepEqual(validData, out)
  t.end()
})
