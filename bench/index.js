var Benchmark = require('benchmark')
var protobufNpm = require('protocol-buffers')
var protobuf = require('../')
var fs = require('fs')
var proto = fs.readFileSync(__dirname + '/bench.proto')
var messages = protobuf(proto)
var messagesNpm = protobufNpm(proto)

var EXAMPLE = {
  foo: 'hello',
  hello: 42,
  payload: new Buffer('a'),
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
    .add(name + ' (encode)', () => {
      return encode(EXAMPLE)
    })
    .add(name + ' (decode)', () => {
      return decode(EXAMPLE_BUFFER)
    })
    .add(name + '(encode + decode)', () => {
      return decode(encode(EXAMPLE))
    })
}

add('JSON', JSON.stringify, JSON.parse)
add('npm', messagesNpm.Test.encode, messagesNpm.Test.decode)
add('local', messages.Test.encode, messages.Test.decode)

suite
  .on('cycle', (e) => console.log(String(e.target)))
  .run()
