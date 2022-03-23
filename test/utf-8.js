const tape = require('tape')
const UTF8 = require('./helpers/messages').UTF8

tape('strings can be utf-8', function (t) {
  const ex = {
    foo: 'ビッグデータ「人間の解釈が必要」「量の問題ではない」論と、もう一つのビッグデータ「人間の解釈が必要」「量の問題ではない」論と、もう一つの',
    bar: 42
  }
  const b1 = UTF8.encode(ex)

  t.same(UTF8.decode(b1), ex)
  t.end()
})
