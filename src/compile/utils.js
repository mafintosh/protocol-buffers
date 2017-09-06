'use strict'

exports.defined = function (val) {
  return val !== null && val !== undefined && (typeof val !== 'number' || !isNaN(val))
}
