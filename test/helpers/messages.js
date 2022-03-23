const path = require('path')
const fs = require('fs')

if (process.env.COMPILED) module.exports = require('./compiled.js')
else module.exports = require('../../')(fs.readFileSync(path.join(__dirname, '../test.proto')))
