var varint = require('varint');

var compile = function(main, messages) {
	var subtype = function(main) {
		var types = [];

		Object.keys(main.fields).forEach(function(key) {
			var field = main.fields[key];
			var tag = parseInt(main.fields[key].tag, 10);

			var ondouble = function(obj, buf, offset) {
				obj[key] = buf.readDoubleBE(offset);
				return offset + 8;
			};

			var onboolean = function(obj, buf, offset) {
				obj[key] = !!varint.decode(buf, offset);
				return varint.decode.bytesRead + offset;
			};

			var onvarint = function(obj, buf, offset) {
				obj[key] = varint.decode(buf, offset);
				return varint.decode.bytesRead + offset;
			};

			var onbytes = function(obj, buf, offset) {
				var len = varint.decode(buf, offset);
				offset += varint.decode.bytesRead;
				obj[key] = buf.slice(offset, offset+len);
				return offset+len;
			};

			var onstring = function(obj, buf, offset) {
				var len = varint.decode(buf, offset);
				offset += varint.decode.bytesRead;
				obj[key] = buf.slice(offset, offset+len).toString();
				return offset+len;
			};

			var onsubtype = function(type) {
				var dec = subtype(type);
				return function(obj, buf, offset) {
					len = varint.decode(buf, offset);
					offset += varint.decode.bytesRead;
					return dec(obj[key] = {}, buf, offset, offset+len);
				};
			};

			switch (field.type) {
				case 'int32':
				case 'int64':
				case 'uint32':
				case 'uint64':
				case 'sint32':
				case 'sint64':
				case 'enum':
				return types[tag] = onvarint;

				case 'float':
				case 'double':
				return types[tag] = ondouble;

				case 'bytes':
				return types[tag] = onbytes;

				case 'string':
				return types[tag] = onstring;

				case 'bool':
				return types[tag] = onboolean;
			}

			if (messages[field.type]) return types[tag] = onsubtype(messages[field.type]);

			throw new Error('Unsupported field type: '+field.type);
		});

		return function(obj, buf, offset, len) {
			while (offset < len) {
				var prefix = varint.decode(buf, offset);
				var type = prefix & 0x7;
				var tag = prefix >> 3;
				if (!types[tag]) throw new Error('Invalid buffer');
				offset = types[tag](obj, buf, offset + varint.decode.bytesRead);
			}

			return offset;
		};
	};

	var dec = subtype(main);
	return function(buf) {
		var obj = {};
		dec(obj, buf, 0, buf.length);
		return obj;
	};
};

module.exports = compile;