var tape = require('tape')
var protobuf = require('../require')
var Optional = protobuf('./test.proto').Optional

tape('defaults decode null', function(t) {
  var emptyBuffer = new Buffer(0)
  var floats = new Float32Array(1)  // floats require special handling for equality
  floats[0] = 4.3234
  var partialObj = {
    'int32': 12345,
    'float': floats[0],
    'double': 12.49342,
    'string': 'foo'
  }
  var partialBuffer = Optional.encode(partialObj)
  console.log(JSON.stringify(Optional.decode(partialBuffer)))

  t.same(Optional.decode(emptyBuffer), {
    "sint32": null,
    "sint64": null,
    "int32": null,
    "uint32": null,
    "int64": null,
    "float": null,
    "double": null,
    "string": null,
    "bool": null,
    "int32_default": 46,
    "float_default": 4.932,
    "double_default": 1.2322,
    "string_default": "foo",
    "bool_default": true
  }, 'all defaults')

  t.same(Optional.decode(partialBuffer), {
    "sint32": null,
    "sint64": null,
    "int32": 12345,
    "uint32": null,
    "int64": null,
    "float": floats[0],
    "double": 12.49342,
    "string": "foo",
    "bool": null,
    "int32_default": 46,
    "float_default": 4.932,
    "double_default": 1.2322,
    "string_default": "foo",
    "bool_default": true
  }, 'partial defaults')

  t.end()
})
