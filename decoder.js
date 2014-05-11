var varint = require('varint');

var compile = function(schema) {
	var subtype = function(main) {
		var types = [];

		main.fields.forEach(function(field, i) {
			var tag = field.tag || i;
			var key = field.name;

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

			var onobject = function(type) {
				var dec = subtype(type);
				return function(obj, buf, offset) {
					var len = varint.decode(buf, offset);
					offset += varint.decode.bytesRead;
					return dec(obj[key] = {}, buf, offset, offset+len);
				};
			};

			var onarray = function(type) {
				var dec = subtype(type.items);
				return function(obj, buf, offset) {
					var len = varint.decode(buf, offset);
					offset += varint.decode.bytesRead;
					var end = offset + len;
					obj[key] = [];
					while (offset < end) {
						var next = {};
						obj[key].push(next);
						var itemLen = varint.decode(buf, offset);
						offset += varint.decode.bytesRead;
						offset = dec(next, buf, offset, offset, offset+itemLen);
					}
					return offset;
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
				case 'number':
				return types[tag] = ondouble;

				case 'bytes':
				return types[tag] = onbytes;

				case 'string':
				return types[tag] = onstring;

				case 'bool':
				return types[tag] = onboolean;

				case 'object':
				return types[tag] = onobject(field);

				case 'array':
				return types[tag] = onarray(field);
			}

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

	var dec = subtype(schema);
	return function(buf) {
		var obj = {};
		dec(obj, buf, 0, buf.length);
		return obj;
	};
};

module.exports = compile;