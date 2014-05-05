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

module.exports = function(main, messages) {
	if (Buffer.isBuffer(main) || (typeof main === 'string' && !messages)) {
		messages = parse(main);
		main = Object.keys(messages)[0];
	}

	if (Buffer.isBuffer(messages)) messages = parse(messages);
	if (typeof main === 'string') main = messages[main];

	var that = {};

	that.encode = encoder(main, messages);
	that.decode = decoder(main, messages);

	return that;
};