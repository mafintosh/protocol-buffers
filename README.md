# protocol-buffers

Encode/decode protocol buffers in node with stream support

	npm install protocol-buffers

![dat](http://img.shields.io/badge/Development%20sponsored%20by-dat-green.svg?style=flat)

## Usage

You should pass a parsed `.proto` file (using [proto2json](https://github.com/Sannis/node-proto2json)) or a raw buffer/string
consisting of the proto messages. Per default the first message is used as the main one. Add an optional second argument to set it
to a specific message

Assuming the following `test.proto` file exists

```
message Test {
  float num  = 1;
  string payload = 2;
}
```

``` js
var protobuf = require('protocol-buffers');
var schema = protobuf(fs.readFileSync('test.proto'));

var buf = schema.encode({
	num: 42,
	payload: 'hello world'
});

console.log(buf); // should print a buffer

var obj = schema.decode(buf);

console.log(obj); // should print an object similar to above
```

You can also stream the encoding/decodings

``` js
var encoder = schema.createEncodeStream();

encoder.write({
	num: 42,
	payload: 'hello world'
});

encoder.write({
	num: 43,
	payload: 'hello another world'
});

...

encoder.on('data', function(buf) {
	// buf is a buffer with the encoded object
});
```

And similarly if you wanted to decode

``` js
var decoder = schema.createEncodeStream();

decoder.write(buf);
decoder.on('data', function(obj) {
	// obj is an unpacked object
});
```

Note that each buffer passed to `decoder.write` should contain a full protobuf object so make sure
you do some sort of delimiting/length-prefixing first

## License

MIT