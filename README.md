# protocol-buffers

Encode/decode protocol buffers in node with stream support

	npm install protocol-buffers

[![build status](http://img.shields.io/travis/mafintosh/protocol-buffers.svg?style=flat)](http://travis-ci.org/mafintosh/protocol-buffers)
![dat](http://img.shields.io/badge/Development%20sponsored%20by-dat-green.svg?style=flat)

## Usage

Pass in a proto file as a [proto2json](https://www.npmjs.org/package/proto2json) object or specify the schema using json
Assuming the following `test.proto` file exists

```
message Test {
  required float num  = 1;
  required string payload = 2;
}
```

``` js
var protobuf = require('protocol-buffers');
var proto2json = require('proto2json')
var schema = protobuf(proto2json.parse(fs.readFileSync('test.proto', 'utf-8')));

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
var decoder = schema.createDecodeStream();

decoder.write(buf);
decoder.on('data', function(obj) {
	// obj is an unpacked object
});
```

Note that each buffer passed to `decoder.write` should contain a full protobuf object so make sure
you do some sort of delimiting/length-prefixing first

In addition to passing in a raw proto file you can also specify the schema as JSON

``` js
var schema = protobuf([{
	name: 'num',
	type: 'float'
}, {
	name: 'payload',
	type: 'bytes'
}, {
	name: 'some_nested_thing',
	type: 'object',
	fields: [{
		name: 'another_prop',
		type: 'string'
	}]
}]);
```

## License

MIT