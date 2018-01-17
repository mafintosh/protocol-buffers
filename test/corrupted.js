var tape = require('tape')
var protobuf = require('../')

var protoStr = 'enum AbcType {\n' +
  '  IGNORE                 =  0;\n' +
  '  ACK_CONFIRMATION_TOKEN =  1;\n' +
  '}\n' +
  'message AbcAcknowledgeConfirmationToken { // 0x01\n' +
  '  optional uint64 confirmation_token = 1;\n' +
  '  extensions 1000 to max;\n' +
  '}\n' +
  'message ABC {\n' +
  '  required AbcType type = 9;\n' +
  '  required uint32 api_version = 8;\n' +
  '  optional AbcAcknowledgeConfirmationToken ack_confirmation_token = 1;\n' +
  '  extensions 1000 to max;\n' +
  '}\n' +
  'message Open {\n' +
  '  required bytes feed = 1;\n' +
  '  required bytes nonce = 2;\n' +
  '}'

var messages = protobuf(protoStr)

tape('invalid message decode', function (t) {
  var didFail = false
  try {
    messages.ABC.decode(Buffer.from([8, 182, 168, 235, 144, 178, 41]))
  } catch (e) {
    didFail = true
  }
  t.same(didFail, true, 'bad input')
  t.end()
})

tape('non buffers should fail', function (t) {
  var didFail = false
  try {
    messages.ABC.decode({})
  } catch (e) {
    didFail = true
  }
  t.same(didFail, true, 'bad input')
  t.end()
})

tape('protocol parser test case', function (t) {
  var didFail = false
  var buf = Buffer.from('cec1', 'hex')
  try {
    messages.Open.decode(buf)
  } catch (err) {
    didFail = true
  }
  t.same(didFail, true, 'bad input')
  t.end()
})
