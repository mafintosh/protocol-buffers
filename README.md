# protons

> [Protocol Buffers](https://developers.google.com/protocol-buffers/) for Node.js and the browser without compilation and `eval`.
>
> Forked from [protocol-buffers](https://github.com/mafintos/protocol-buffers) to remove usage of `eval`.

```
> npm install protons
```

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
const protons = require('protons')

// pass a proto file as a buffer/string or pass a parsed protobuf-schema object
const messages = protons(fs.readFileSync('test.proto'))

const buf = messages.Test.encode({
  num: 42,
  payload: 'hello world'
})

console.log(buf) // should print a buffer
```

To decode a message use `Test.decode`

``` js
const obj = messages.Test.decode(buf)
console.log(obj) // should print an object similar to above
```

Enums are accessed in the same way as messages

``` js
const buf = messages.AnotherOne.encode({
  list: [
    messages.FOO.BAR
  ]
})
```

Nested emums are accessed as properties on the corresponding message

``` js
const buf = message.SomeMessage.encode({
  list: [
    messages.SomeMessage.NESTED_ENUM.VALUE
  ]
})
```

See the [Google Protocol Buffers docs](https://developers.google.com/protocol-buffers/) for more information about the
available types etc.

## Performance

This module is pretty fast.

You can run the benchmarks yourself by doing `npm run bench`.

On my Macbook Pro it gives the following results

```

```

Note that JSON parsing/serialization in node is a native function that is *really* fast.

## Leveldb encoding compatibility

Compiled protocol buffers messages are valid levelup encodings.
This means you can pass them as `valueEncoding` and `keyEncoding`.

``` js
const level = require('level')
const db = level('db')

db.put('hello', {payload:'world'}, {valueEncoding:messages.Test}, (err) => {
  db.get('hello', {valueEncoding:messages.Test}, (err, message) => {
    console.log(message)
  })
})
```

## License

MIT
