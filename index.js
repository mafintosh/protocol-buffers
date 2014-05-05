var stream = require('stream');
var util = require('util');
var proto2json = require('proto2json');
var encoder = require('./encoder');
var decoder = require('./decoder');

var parse = function(buf) {
	var result;
	proto2json.parse(buf.toString(), function(err, buf) {
		if (err) throw err;
		result = buf;
	});
	return result.messages;
};

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

module.exports = function(messages, main) {
	if (Buffer.isBuffer(messages) || (typeof messages === 'string')) messages = parse(messages);
	if (messages.messages) messages = messages.messages;
	if (!main) main = Object.keys(messages)[0];
	if (typeof main === 'string') main = messages[main];

	var that = {};

	that.encode = encoder(main, messages);
	that.decode = decoder(main, messages);

	that.createEncodeStream = function() {
		return new Transformer(that.encode);
	};

	that.createDecodeStream = function() {
		return new Transformer(that.decode);
	};

	return that;
};