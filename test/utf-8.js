var tape = require('tape')
var path = require('path')
var fs = require('fs')
var protobuf = require('../')
var UTF8 = protobuf(fs.readFileSync(__dirname + '/test.proto')).UTF8

tape('strings can be utf-8', function(t) {
  var ex = {
    foo: 'ビッグデータ「人間の解釈が必要」「量の問題ではない」論と、もう一つのビッグデータ「人間の解釈が必要」「量の問題ではない」論と、もう一つの',
    bar: 42
  }
  var b1 = UTF8.encode(ex)

  t.same(UTF8.decode(b1), ex)
  t.end()
})
