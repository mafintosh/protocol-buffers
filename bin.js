#!/usr/bin/env node
const protobuf = require('./')
const fs = require('fs')

let filename = null
let output = null
let watch = false
let encodings = null

// handrolled parser to not introduce minimist as this is used a bunch of prod places
// TODO: if this becomes more complicated / has bugs, move to minimist
for (let i = 2; i < process.argv.length; i++) {
  const v = process.argv[i]
  const n = v.split('=')[0]
  if (v[0] !== '-') {
    filename = v
  } else if (n === '--output' || n === '-o' || n === '-wo') {
    if (n === '-wo') watch = true
    output = v === n ? process.argv[++i] : v.split('=').slice(1).join('=')
  } else if (n === '--watch' || n === '-w') {
    watch = true
  } else if (n === '--encodings' || n === '-e') {
    encodings = v === n ? process.argv[++i] : v.split('=').slice(1).join('=')
  }
}

if (!filename) {
  console.error('Usage: protocol-buffers [schema-file.proto] [options]')
  console.error()
  console.error(' --output, -o  [output-file.js]')
  console.error(' --watch,  -w  (recompile on schema change)')
  console.error()
  process.exit(1)
}

if (watch && !output) {
  console.error('--watch requires --output')
  process.exit(1)
}

if (!output) {
  process.stdout.write(compile())
} else {
  write()
  if (watch) fs.watch(filename, write)
}

function write () {
  fs.writeFileSync(output, compile())
}

function compile () {
  return protobuf.toJS(fs.readFileSync(filename), { encodings })
}
