var proto2json = require('proto2json');

var parseMessages = function(buf) {
	var result;
	proto2json.parse(buf.toString(), function(err, buf) {
		if (err) throw err;
		result = buf;
	});
	return result.messages;
};


var parse = function(proto, main) {
	var messages = Buffer.isBuffer(proto) || typeof proto === 'string' ? parseMessages(proto) : proto;
	if (!main) main = Object.keys(messages)[0];

	main = messages[main];

	var map = function(main) {
		return Object.keys(main.fields).map(function(key) {
			var type = main.fields[key].type;
			var field = {
				name: key,
				type: main.fields[key].type,
				tag: parseInt(main.fields[key].tag)
			};

			if (!messages[type]) return field;

			field.fields = map(messages[field.type]);
			field.type = 'object';

			return field;
		});
	};

	return map(main);
};

module.exports = parse;