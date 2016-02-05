var protobuf = require('../')
var fs = require('fs')
var messages = protobuf(fs.readFileSync(__dirname + '/bench.proto'))

var TIMES = 1000000

var then = 0
var diff = 0

var run = function (name, encode, decode) {
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

  var EXAMPLE_BUFFER = encode(EXAMPLE)
  var i

  console.log('Benchmarking %s', name)
  console.log('  Running object encoding benchmark...')

  then = Date.now()
  for (i = 0; i < TIMES; i++) {
    encode(EXAMPLE)
  }
  diff = Date.now() - then

  console.log('  Encoded %d objects in %d ms (%d enc/s)\n', TIMES, diff, (1000 * TIMES / diff).toFixed(0))

  console.log('  Running object decoding benchmark...')

  then = Date.now()
  for (i = 0; i < TIMES; i++) {
    decode(EXAMPLE_BUFFER)
  }
  diff = Date.now() - then

  console.log('  Decoded %d objects in %d ms (%d dec/s)\n', TIMES, diff, (1000 * TIMES / diff).toFixed(0))

  console.log('  Running object encoding+decoding benchmark...')

  then = Date.now()
  for (i = 0; i < TIMES; i++) {
    decode(encode(EXAMPLE))
  }
  diff = Date.now() - then

  console.log('  Encoded+decoded %d objects in %d ms (%d enc+dec/s)\n', TIMES, diff, (1000 * TIMES / diff).toFixed(0))
}

run('JSON (baseline)', JSON.stringify, JSON.parse)
run('protocol-buffers', messages.Test.encode, messages.Test.decode)
