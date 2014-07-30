var protobuf = require('./require')

var messages = protobuf('./example.proto')

var ex = {
  foo: 'hello world',
  num: 42
}

var buf = messages.Test.encode(ex)

console.log('test message', ex)
console.log('encoded test message', buf)
console.log('encoded test message decoded', messages.Test.decode(buf))