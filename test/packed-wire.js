const tape = require('tape')
const vm = require('vm')
const protobuf = require('..')

const compilers = {
  runtime: protobuf,
  precompiled: function (schema) {
    const exports = {}
    vm.runInThisContext('(function (exports, require) {\n' + protobuf.toJS(schema) + '\n})')(exports, require)
    return exports
  }
}

const types = [
  { name: 'int32', one: '01', two: '02', values: [1, 2], wireType: 0 },
  { name: 'uint32', one: '01', two: '02', values: [1, 2], wireType: 0 },
  { name: 'sint32', one: '01', two: '02', values: [-1, 1], wireType: 0 },
  { name: 'bool', one: '00', two: '01', values: [false, true], wireType: 0 },
  { name: 'fixed32', one: '01000000', two: '02000000', values: [1, 2], wireType: 5 },
  { name: 'fixed64', one: '0100000000000000', two: '0200000000000000', values: [Buffer.from('0100000000000000', 'hex'), Buffer.from('0200000000000000', 'hex')], wireType: 1 },
  { name: 'float', one: '0000803f', two: '00000040', values: [1, 2], wireType: 5 },
  { name: 'double', one: '000000000000f03f', two: '0000000000000040', values: [1, 2], wireType: 1 },
  { name: 'Choice', one: '01', two: '02', values: [1, 2], wireType: 0 }
]

Object.keys(compilers).forEach(function (compiler) {
  types.forEach(function (type) {
    const options = type.name === 'Choice' ? ['', '[packed = false]'] : ['', '[packed = false]', '[packed = true]']
    options.forEach(function (option) {
      tape(compiler + ': ' + type.name + ' ' + option + ' accepts packed and unpacked wire data', function (t) {
        const messages = compilers[compiler](`syntax = "proto3"; enum Choice { ZERO = 0; ONE = 1; TWO = 2; } message Values { repeated ${type.name} values = 1 ${option}; uint32 following = 2; }`)
        const tag = (8 | type.wireType).toString(16).padStart(2, '0')
        const length = (type.one.length / 2).toString(16).padStart(2, '0')
        const total = (type.one.length / 2 + type.two.length / 2).toString(16).padStart(2, '0')
        const packets = [
          '0a' + total + type.one + type.two + '1009',
          tag + type.one + tag + type.two + '1009',
          '0a' + length + type.one + tag + type.two + '1009',
          tag + type.one + '0a00' + '0a' + length + type.two + '1009'
        ]
        packets.forEach(function (hex) {
          let decoded
          t.doesNotThrow(function () { decoded = messages.Values.decode(Buffer.from(hex, 'hex')) }, hex)
          t.same(decoded, { values: type.values, following: 9 }, hex)
        })
        let empty
        t.doesNotThrow(function () { empty = messages.Values.decode(Buffer.from('0a001009', 'hex')) }, 'empty packed field')
        t.same(empty, { values: [], following: 9 }, 'empty packed field')
        t.end()
      })
    })
  })

  tape(compiler + ': malformed packed lengths are rejected', function (t) {
    const messages = compilers[compiler]('syntax = "proto3"; message Values { repeated fixed32 values = 1; }')
    ;['0a0501000000', '0a03010000', '0a0101000000'].forEach(function (hex) {
      t.throws(function () { messages.Values.decode(Buffer.from(hex, 'hex')) }, undefined, hex)
    })
    t.end()
  })
})
