var Buffer = require('safe-buffer').Buffer
var Benchmark = require('benchmark')
var protobufNpm = require('protocol-buffers')
var protobuf = require('../')
var fs = require('fs')
var path = require('path')
var proto = fs.readFileSync(path.join(__dirname, '/bench.proto'))
var messages = protobuf(proto)
var messagesNpm = protobufNpm(proto)

var EXAMPLE = {
  foo: 'hello',
  hello: 42,
  payload: Buffer.from('a'),
  meh: {
    b: {
      tmp: {
        baz: 1000
      }
    },
    lol: 'lol'
  }
}

var suite = new Benchmark.Suite()

function add (name, encode, decode) {
  var EXAMPLE_BUFFER = encode(EXAMPLE)

  suite
    .add(name + ' (encode)', function () {
      return encode(EXAMPLE)
    })
    .add(name + ' (decode)', function () {
      return decode(EXAMPLE_BUFFER)
    })
    .add(name + '(encode + decode)', function () {
      return decode(encode(EXAMPLE))
    })
}

add('JSON', JSON.stringify, JSON.parse)
add('npm', messagesNpm.Test.encode, messagesNpm.Test.decode)
add('local', messages.Test.encode, messages.Test.decode)

suite
  .on('cycle', function (e) {
    console.log(String(e.target))
  })
  .run()
