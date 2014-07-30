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

To use the above proto file to encode/decode messages do

``` js
var protobuf = require('protocol-buffers')

// pass a proto file as a buffer/string or pass a parsed protobuf-schema object
var messages = protobuf(fs.readFileSync('test.proto'))

var buf = messages.Test.encode({
	num: 42,
	payload: 'hello world'
});

console.log(buf); // should print a buffer

var obj = messages.Test.decode(buf);

console.log(obj); // should print an object similar to above
```

You can also use `protocol-buffers/require` to require .proto files from disk instead of
passing them as buffers

``` js
var protobuf = require('protocol-buffers/require')
var messages = protobuf('test.proto') // will load and parse __dirname/test.proto
```

See the [Google Protocol Buffers docs](https://developers.google.com/protocol-buffers/) for more information about the
available types etc.

## Performance

This module is fast. It uses code generation to build as fast as possible encoder/decoder for the protobuf schema
You can running the benchmark yourself by doing `npm run bench`. On my Macbook Air it gives the following results

```
Benchmarking JSON (baseline)
  Running object encoding benchmark...
  Encoded 1000000 objects in 2213 ms (451875 enc/s)

  Running object decoding benchmark...
  Decoded 1000000 objects in 988 ms (1012146 dec/s)

  Running object encoding+decoding benchmark...
  Encoded+decoded 1000000 objects in 3434 ms (291206 enc+dec/s)

Benchmarking protocol-buffers
  Running object encoding benchmark...
  Encoded 1000000 objects in 2113 ms (473261 enc/s)

  Running object decoding benchmark...
  Decoded 1000000 objects in 886 ms (1128668 dec/s)

  Running object encoding+decoding benchmark...
  Encoded+decoded 1000000 objects in 2994 ms (334001 enc+dec/s)
```

Note that JSON parsing/serialization in node is native function that is *really* fast.

## License

MIT