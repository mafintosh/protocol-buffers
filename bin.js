#!/usr/bin/env node
const protobuf = require('./')
const fs = require('fs')
const path = require('path')

let filename = null
let output = null
let watch = false
let encodings = null
const importPaths = []

// handrolled parser to not introduce minimist as this is used a bunch of prod places
// TODO: if this becomes more complicated / has bugs, move to minimist
for (let i = 2; i < process.argv.length; i++) {
  const parts = process.argv[i].split('=')
  const key = parts[0]
  const value = parts.slice(1).join('=')
  if (key[0] !== '-') {
    filename = path.resolve(key)
  } else if (key === '--output' || key === '-o' || key === '-wo') {
    if (key === '-wo') watch = true
    output = value || process.argv[++i]
  } else if (key === '--watch' || key === '-w') {
    watch = true
  } else if (key === '--encodings' || key === '-e') {
    encodings = value || process.argv[++i]
  } else if (key === '--proto_path' || key === '-I') {
    importPaths.push(path.resolve(value || process.argv[++i]))
  }
}
importPaths.push(process.cwd())

if (!filename) {
  console.error('Usage: protocol-buffers [schema-file.proto] [options]')
  console.error()
  console.error(' --output, -o      [output-file.js]')
  console.error(' --watch,  -w      (recompile on schema change)')
  console.error(' --proto_path, -I  [path-root] # base to lookup imports, multiple supported')
  console.error()
  process.exit(1)
}
filename = path.relative(process.cwd(), filename)

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

function resolveImport (filename) {
  for (let i = 0; i < importPaths.length; i++) {
    const importPath = importPaths[i]
    try {
      return fs.readFileSync(path.join(importPath, filename))
    } catch (err) {}
  }
  throw new Error('File "' + filename + '" not found in import path:\n - ' + importPaths.join('\n - '))
}

function compile () {
  return protobuf.toJS(null, {
    encodings: encodings,
    filename: filename,
    resolveImport: resolveImport
  })
}
