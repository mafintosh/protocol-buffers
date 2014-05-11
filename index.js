var stream = require('stream');
var util = require('util');
var encoder = require('./encoder');
var decoder = require('./decoder');
var parse = require('./parse-proto');

var Transformer = function(fn) {
	this._fn = fn;
	stream.Transform.call(this, {highWaterMark:16, objectMode:true});
};

util.inherits(Transformer, stream.Transform);

Transformer.prototype._transform = function(obj, enc, cb) {
	try {
		obj = this._fn(obj);
	} catch (err) {
		return cb(err);
	}
	cb(null, obj);
};

module.exports = function(schema, main) {
	if (Buffer.isBuffer(schema) || typeof schema === 'string') return module.exports(parse(schema, main));
	if (Array.isArray(schema)) schema = {type:'object', fields:schema};

	var that = {};

	that.encode = encoder(schema);
	that.decode = decoder(schema);

	that.createEncodeStream = function() {
		return new Transformer(that.encode);
	};

	that.createDecodeStream = function() {
		return new Transformer(that.decode);
	};

	return that;
};