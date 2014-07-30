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
var protobuf = require('protocol-buffers');
var messages = protobuf(fs.readFileSync('test.proto'));

var buf = messages.Test.encode({
	num: 42,
	payload: 'hello world'
});

console.log(buf); // should print a buffer

var obj = messages.Test.decode(buf);

console.log(obj); // should print an object similar to above
```

See the [Google Protocol Buffers docs](https://developers.google.com/protocol-buffers/) for more information about the
available types etc.

## License

MIT