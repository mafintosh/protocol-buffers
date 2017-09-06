/* eslint no-console: "off" */
'use strict'

var protobuf = require('./')
var path = require('path')
var fs = require('fs')

var messages = protobuf(fs.readFileSync(path.join(__dirname, '/example.proto')))

var ex = {
  foo: 'hello world',
  num: 42
}

var buf = messages.Test.encode(ex)

console.log('test message', ex)
console.log('encoded test message', buf)
console.log('encoded test message decoded', messages.Test.decode(buf))
