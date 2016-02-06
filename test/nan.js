var tape = require('tape')
var protobuf = require('../')

var protoStr = 'message MyMessage {\n' +
  '  optional uint32 my_number = 1;\n' +
  '  required string my_other = 2;\n' +
  '}'

var messages = protobuf(protoStr)

tape('NaN considered not defined', function (t) {
  var didFail = false
  var error
  var encoded
  var decoded
  var testString = 'hello!'
  var properResult = new Buffer([0x12, 0x06, 0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x21])
  try {
    encoded = messages.MyMessage.encode({ my_number: NaN, my_other: testString })
    decoded = messages.MyMessage.decode(encoded)
    t.same(decoded.my_other, testString, 'object is parsable')
    t.same(encoded, properResult, 'object was encoded properly')
  } catch (e) {
    error = e
    didFail = true
  }
  t.same(didFail, false, error ? 'parsing error: ' + error.toString() : 'no parsing error')
  t.end()
})
