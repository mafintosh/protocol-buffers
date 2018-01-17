#!/usr/bin/env node

var protobuf = require('./')
var encodings = require('protocol-buffers-encodings')
var fs = require('fs')
var os = require('os')

var messages = protobuf(fs.readFileSync(process.argv[2]))
var out = ''

out += 'var encodings = require(\'protocol-buffers-encodings\')' + os.EOL
out += 'var varint = encodings.varint' + os.EOL
out += os.EOL
out += '/* eslint-disable quotes */' + os.EOL
out += '/* eslint-disable indent */' + os.EOL
out += '/* eslint-disable no-redeclare */' + os.EOL
out += os.EOL

Object.keys(messages).forEach(function (name) {
  out += 'var ' + name + ' = exports.' + name + ' = {' + os.EOL
  out += '  buffer: true,' + os.EOL
  out += '  encodingLength: null,' + os.EOL
  out += '  encode: null,' + os.EOL
  out += '  decode: null' + os.EOL
  out += '}' + os.EOL
})

out += os.EOL
Object.keys(messages).forEach(function (name) {
  out += 'define' + name + '()' + os.EOL
  out += 'function define' + name + ' () {' + os.EOL
  out += '  var enc = [' + os.EOL

  messages[name].dependencies.forEach(function (e, i, enc) {
    var name = encodings.name(e)
    if (name) name = 'encodings.' + name
    out += '    ' + name + (i < enc.length - 1 ? ',' : '') + os.EOL
  })

  out += '  ]' + os.EOL + os.EOL
  out += '  ' + name + '.encodingLength = encodingLength' + os.EOL
  out += '  ' + name + '.encode = encode' + os.EOL
  out += '  ' + name + '.decode = decode' + os.EOL + os.EOL
  out += '  ' + funToString(messages[name].encodingLength, '  ') + os.EOL + os.EOL
  out += '  ' + funToString(messages[name].encode, '  ') + os.EOL + os.EOL
  out += '  ' + funToString(messages[name].decode, '  ') + os.EOL
  out += '}' + os.EOL + os.EOL
})

out += funToString(require('./compile').defined, '') + os.EOL + os.EOL
out += funToString(require('./compile').skip, '') + os.EOL

function funToString (fn, spaces) {
  return fn.toString().split('\n').map(indent).join('\n')

  function indent (n, i) {
    if (!i) return n.replace(/(function \w+)\(/, '$1 (')
    return spaces + n
  }
}

/*
     exports.toString = function () {
       var encStr = 'var enc = [\n' +
         enc.map(function (e, i) {
           var name = encodings.name(e)
           if (name) name = 'encodings.' + name
           return '  ' + name + (i < enc.length - 1 ? ',' : '') + '\n'
         }).join('') +
         ']\n'

       return encStr +
         'exports.' + exports.name + ' = {\n' +
         '  encodingLength: ' + funToString(exports.encodingLength) + ',\n' +
         '  encode: ' + funToString(exports.encode) + ',\n' +
         '  decode: ' + funToString(exports.decode) + '\n}\n'
     }

     return exports
   }

*/

process.stdout.write(out)
