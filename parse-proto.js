var parse = function(messages, main) {
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