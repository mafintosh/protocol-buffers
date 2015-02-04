# protocol-buffers

[Protocol Buffers](https://developers.google.com/protocol-buffers/) for Node.js

```
npm install protocol-buffers
```

[![build status](http://img.shields.io/travis/mafintosh/protocol-buffers.svg?style=flat)](http://travis-ci.org/mafintosh/protocol-buffers)
![dat](http://img.shields.io/badge/Development%20sponsored%20by-dat-green.svg?style=flat)

## Usage

Assuming the following `test.proto` file exists

```
enum FOO {
  BAR = 1;
}

message Test {
  required float num  = 1;
  required string payload = 2;
}

message AnotherOne {
  repeated FOO list = 1;
}
```

Use the above proto file to encode/decode messages by doing

``` js
var protobuf = require('protocol-buffers')

// pass a proto file as a buffer/string or pass a parsed protobuf-schema object
var messages = protobuf(fs.readFileSync('test.proto'))

var buf = messages.Test.encode({
  num: 42,
  payload: 'hello world'
})

console.log(buf) // should print a buffer
```

To decode a message use `Test.decode`

``` js
var obj = messages.Test.decode(buf)
console.log(obj) // should print an object similar to above
```

You can also use `protocol-buffers/require` to require .proto files from disk instead of
passing them as buffers.

``` js
var protobuf = require('protocol-buffers/require')
var messages = protobuf('test.proto') // will load and parse __dirname/test.proto
```

Enums are accessed in the same way as messages

``` js
var buf = messages.AnotherOne.encode({
  list: [
    messages.FOO.BAR
  ]
})
```

Nested emums are accessed as properties on the corresponding message

``` js
var buf = message.SomeMessage.encode({
  list: [
    messages.SomeMessage.NESTED_ENUM.VALUE
  ]
})
```

See the [Google Protocol Buffers docs](https://developers.google.com/protocol-buffers/) for more information about the
available types etc.

## Performance

This module is fast.

It uses code generation to build as fast as possible encoders/decoders for the protobuf schema.
You can run the benchmarks yourself by doing `npm run bench`.

On my Macbook Air it gives the following results

```
Benchmarking JSON (baseline)
  Running object encoding benchmark...
  Encoded 1000000 objects in 2142 ms (466853 enc/s)

  Running object decoding benchmark...
  Decoded 1000000 objects in 970 ms (1030928 dec/s)

  Running object encoding+decoding benchmark...
  Encoded+decoded 1000000 objects in 3131 ms (319387 enc+dec/s)

Benchmarking protocol-buffers
  Running object encoding benchmark...
  Encoded 1000000 objects in 2089 ms (478698 enc/s)

  Running object decoding benchmark...
  Decoded 1000000 objects in 735 ms (1360544 dec/s)

  Running object encoding+decoding benchmark...
  Encoded+decoded 1000000 objects in 2826 ms (353857 enc+dec/s)
```

Note that JSON parsing/serialization in node is a native function that is *really* fast.

## Leveldb encoding compatibility

Compiled protocol buffers messages are valid levelup encodings.
This means you can pass them as `valueEncoding` and `keyEncoding`.

``` js
var level = require('level')
var db = level('db')

db.put('hello', {payload:'world'}, {valueEncoding:messages.Test}, function(err) {
  db.get('hello', {valueEncoding:messages.Test}, function(err, message) {
    console.log(message)
  })
})
```

## License

MIT
