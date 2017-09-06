'use strict'

const Buffer = require('safe-buffer').Buffer
const Benchmark = require('benchmark')
if (typeof window !== 'undefined') {
  window.Benchmark = Benchmark
}

const protobuf = require('protocol-buffers')
const protonsNpm = require('protons')
const protons = require('../')
const proto = require('./bench.proto')
const messages = protobuf(proto)
const messagesBuf = protons(proto)
const messagesNpm = protonsNpm(proto)

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

const suite = new Benchmark.Suite()

function add (name, encode, decode) {
  const EXAMPLE_BUFFER = encode(EXAMPLE)

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
add('protocol-buffers', messagesBuf.Test.encode, messagesBuf.Test.decode)
add('npm', messagesNpm.Test.encode, messagesNpm.Test.decode)
add('local', messages.Test.encode, messages.Test.decode)

suite
  .on('cycle', (e) => {
    console.log(String(e.target))
  })
  .run()
