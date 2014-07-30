var varint = require('varint')

var encoder = function(type, encode, decode, encodingLength) {
  encode.bytes = decode.bytes = 0

  return {
    type: type,
    encode: encode,
    decode: decode,
    encodingLength: encodingLength
  }
}

exports.make = encoder

exports.bytes = function(tag) {
  var encodingLength = function(val) {
    return varint.encodingLength(val.length) + val.length
  }

  var encode = function(val, buffer, offset) {
    var oldOffset = offset

    varint.encode(val.length, buffer, offset)
    offset += varint.encode.bytes

    val.copy(buffer, offset)
    offset += val.length

    encode.bytes = offset - oldOffset
    return buffer
  }

  var decode = function(buffer, offset) {
    var oldOffset = offset

    var len = varint.decode(buffer, offset)
    offset += varint.decode.bytes

    var val = buffer.slice(offset, offset+len)
    offset += val.length

    decode.bytes = offset - oldOffset
    return val
  }

  return encoder(2, encode, decode, encodingLength)
}()

exports.string = function() {
  var encodingLength = function(val) {
    return varint.encodingLength(val.length) + Buffer.byteLength(val)
  }

  var encode = function(val, buffer, offset) {
    var oldOffset = offset
    var len = Buffer.byteLength(val)

    varint.encode(len, buffer, offset, 'utf-8')
    offset += varint.encode.bytes

    buffer.write(val, offset, len)
    offset += len

    encode.bytes = offset - oldOffset
    return buffer
  }

  var decode = function(buffer, offset) {
    var oldOffset = offset

    var len = varint.decode(buffer, offset)
    offset += varint.decode.bytes

    var val = buffer.toString('utf-8', offset, offset+len)
    offset += len

    decode.bytes = offset - oldOffset
    return val
  }

  return encoder(2, encode, decode, encodingLength)
}()

exports.bool = function() {
  var encodingLength = function(val) {
    return 1
  }

  var encode = function(val, buffer, offset) {
    buffer[offset] = val ? 1 : 0
    encode.bytes = 1
    return buffer
  }

  var decode = function(buffer, offset) {
    var bool = buffer[offset] > 0
    decode.bytes = 1
    return bool
  }

  return encoder(0, encode, decode, encodingLength)
}()

exports.int32 =
exports.int64 =
exports.uint32 =
exports.uint64 =
exports.sint32 =
exports.sint64 =
exports.enum =
exports.varint = function() {
  return encoder(0, varint.encode, varint.decode, varint.encodingLength)
}()

// we cannot represent these in javascript so we just use buffers
exports.fixed64exports =
exports.sfixed64exports = function() {
  var encodingLength = function(val) {
    return 8
  }

  var encode = function(val, buffer, offset) {
    val.copy(buffer, offset)
    encode.bytes = 8
    return buffer
  }

  var decode = function(buffer, offset) {
    var val = buffer.slice(offset, offset + 8)
    decode.bytes = 8
    return val
  }

  return encoder(1, encode, decode, encodingLength)
}()

exports.double = function() {
  var encodingLength = function(val) {
    return 8
  }

  var encode = function(val, buffer, offset) {
    buffer.writeDoubleLE(val, offset)
    encode.bytes = 8
    return buffer
  }

  var decode = function(buffer, offset) {
    var val = buffer.readDoubleLE(offset)
    decode.bytes = 8
    return val
  }

  return encoder(1, encode, decode, encodingLength)
}()

exports.fixed32 = function() {
  var encodingLength = function(val) {
    return 4
  }

  var encode = function(val, buffer, offset) {
    buffer.writeUInt32LE(val, offset)
    encode.bytes = 4
    return buffer
  }

  var decode = function(buffer, offset) {
    var val = buffer.readUInt32LE(offset)
    decode.bytes = 4
    return val
  }

  return encoder(5, encode, decode, encodingLength)
}()

exports.sfixed32 = function() {
  var encodingLength = function(val) {
    return 4
  }

  var encode = function(val, buffer, offset) {
    buffer.writeInt32LE(val, offset)
    encode.bytes = 4
    return buffer
  }

  var decode = function(buffer, offset) {
    var val = buffer.readInt32LE(offset)
    decode.bytes = 4
    return val
  }

  return encoder(5, encode, decode, encodingLength)
}()

exports.float = function() {
  var encodingLength = function(val) {
    return 4
  }

  var encode = function(val, buffer, offset) {
    buffer.writeFloatLE(val, offset)
    encode.bytes = 4
    return buffer
  }

  var decode = function(buffer, offset) {
    var val = buffer.readFloadLE(offset)
    decode.bytes = 4
    return val
  }

  return encoder(5, encode, decode, encodingLength)
}()