var protobuf = require('../')
var fs = require('fs')
var path = require('path')
var Benchmark = require('benchmark')
var messages = protobuf(fs.readFileSync(path.join(__dirname, 'bench.proto')))
var Test = messages.Test

var obj = {
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
var json = JSON.stringify(obj)
var buffer = Test.encode(obj)

var benchOptions = {minSamples: 500}
var suite = new Benchmark.Suite()

suite
  .add('JSON (baseline) encoding:', function () {
    JSON.stringify(obj)
  }, benchOptions)
  .add('JSON (baseline) decoding:', function () {
    JSON.parse(json)
  }, benchOptions)
  .add('JSON (baseline) encoding + decoding:', function () {
    JSON.parse(JSON.stringify(obj))
  }, benchOptions)
  .add('protocol-buffers encoding:', function () {
    Test.encode(obj)
  }, benchOptions)
  .add('protocol-buffers decoding:', function () {
    Test.decode(buffer)
  }, benchOptions)
  .add('protocol-buffers encoding + decoding:', function () {
    Test.decode(Test.encode(obj))
  }, benchOptions)
  .on('cycle', function (event) {
    console.log(String(event.target))
  })
  .run({async: false})
