# protocol-buffers

[Protocol Buffers](https://developers.google.com/protocol-buffers/) for Node.js

```
npm install protocol-buffers
```

[![build status](https://github.com/mafintosh/protocol-buffers/actions/workflows/test.yml/badge.svg)](https://github.com/mafintosh/protocol-buffers/actions/workflows/test.yml)
![dat](http://img.shields.io/badge/Development%20sponsored%20by-dat-green.svg?style=flat)

## Usage

Assuming the following `test.proto` file exists

```proto
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

## Compile to a file

Since v4 you can now compile your schemas to a JavaScript file you can require from Node.
This means you do not have runtime parse the schemas, which is useful if using in the browser or on embedded devices.
It also makes the dependency footprint a lot smaller.

``` sh
# first install the cli tool
npm install -g protocol-buffers

# compile the schema
protocol-buffers test.proto -o messages.js

# then install the runtime dependency in the project
npm install --save protocol-buffers-encodings
```

That's it! Then in your application you can simply do

``` js
var messages = require('./messages')

var buf = messages.Test.encode({
  num: 42
})
```

The compilation functionality is also available as a JavaScript API for programmatic use:

``` js
var protobuf = require('protocol-buffers')

// protobuf.toJS() takes the same arguments as protobuf()
var js = protobuf.toJS(fs.readFileSync('test.proto'))
fs.writeFileSync('messages.js', js)
```

## Imports

The cli tool supports protocol buffer [imports][] by default.

**Currently all imports are treated as public and the public/weak keywords
not supported.**

To use it programmatically you need to pass-in a `filename` & a `resolveImport`
hooks:

```js
var protobuf = require('protocol-buffers')
var messages = protobuf(null, {
  filename: 'initial.proto',
  resolveImport (filename) {
    // can return a Buffer, String or Schema
  }
})
```

[imports]: https://developers.google.com/protocol-buffers/docs/proto3#importing_definitions

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
