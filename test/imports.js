const tape = require('tape')
const fs = require('fs')
const path = require('path')
const compile = require('..')
const schema = require('protocol-buffers-schema')

const projectBase = path.resolve(__dirname, '..')
function resolveImport (filename) {
  const filepath = path.resolve(projectBase, filename)
  return fs.readFileSync(filepath)
}

function load (filename) {
  return {
    filename: filename,
    raw: fs.readFileSync(path.join(projectBase, filename))
  }
}

const valid = load('test/imports/valid.proto')

function testCompiled (t, compiled) {
  t.deepEqual(compiled.DeepestEnum, {
    A: 1,
    B: 2,
    C: 3
  })

  const encoded = {
    deepestMessage: compiled.DeepestMessage.encode({
      field: 3
    }),
    deeper: compiled.Deeper.encode({
      foo: {
        field: 1
      },
      bar: 2
    }),
    deeper2: compiled.Deeper2.encode({
      foo: {
        field: 3
      }
    }),
    valid: compiled.Valid.encode({
      ext: {
        foo: {
          field: 3
        },
        bar: 1
      }
    })
  }

  t.deepEqual(encoded.deeper, Buffer.from('0a0208011002', 'hex'))

  const decoded = {
    deepestMessage: compiled.DeepestMessage.decode(encoded.deepestMessage),
    deeper: compiled.Deeper.decode(encoded.deeper)
  }
  t.deepEqual(decoded, {
    deepestMessage: {
      field: 3
    },
    deeper: {
      foo: {
        field: 1
      },
      bar: 2
    }
  })
  t.end()
}

if (process.env.COMPILED) {
  tape('validated compiled', function (t) {
    testCompiled(t, require('./helpers/imports.js'))
  })
}

tape('valid imports', function (t) {
  testCompiled(t, compile(null, {
    filename: valid.filename,
    resolveImport: resolveImport
  }))
})

const deeper = load('test/imports/folder-a/folder-b/deeper.proto')
const deeper2 = load('test/imports/folder-a/folder-b/deeper2.proto')
const deepest = load('test/imports/folder-a/deepest.proto')

tape('valid import with pre-parsed schemas', function (t) {
  const cache = {}
  cache[valid.filename] = schema.parse(valid.raw)
  cache[deeper.filename] = schema.parse(deeper.raw)
  cache[deeper2.filename] = schema.parse(deeper2.raw)
  cache[deepest.filename] = schema.parse(deepest.raw)
  t.deepEquals(Object.keys(compile(null, {
    filename: valid.filename,
    resolveImport: function (filename) {
      return cache[filename]
    }
  })), ['DeepestEnum', 'Valid', 'Deeper', 'DeepestMessage', 'Deeper2'])
  t.end()
})

tape('valid import without resolving', function (t) {
  t.throws(function () {
    compile(valid.raw, {})
  }, /Could not resolve Deeper/)
  t.end()
})

tape('import with .filename, without resolveImports', function (t) {
  t.throws(function () {
    compile(null, {
      filename: 'test'
    })
  }, /opts.resolveImport is required if opts.filename is given./)
  t.end()
})

const invalid = load('test/imports/invalid.proto')

tape('circular import', function (t) {
  t.throws(function () {
    compile(invalid.raw, {
      filename: invalid.filename,
      resolveImport: resolveImport
    })
  }, /File recursively imports itself: test\/imports\/invalid.proto -> test\/imports\/folder-a\/circular.proto -> test\/imports\/invalid.proto/)
  t.end()
})
