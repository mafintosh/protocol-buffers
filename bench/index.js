const protobuf = require('../')
const fs = require('fs')
const path = require('path')
const messages = protobuf(fs.readFileSync(path.join(__dirname, 'bench.proto')))

const TIMES = 1000000

let then = 0
let diff = 0

const run = function (name, encode, decode) {
  const EXAMPLE = {
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

  const EXAMPLE_BUFFER = encode(EXAMPLE)
  let i

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
