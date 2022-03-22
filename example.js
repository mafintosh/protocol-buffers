const protobuf = require('./')
const fs = require('fs')
const path = require('path')

const messages = protobuf(fs.readFileSync(path.join(__dirname, 'example.proto')))

const ex = {
  foo: 'hello world',
  num: 42
}

const buf = messages.Test.encode(ex)

console.log('test message', ex)
console.log('encoded test message', buf)
console.log('encoded test message decoded', messages.Test.decode(buf))
