var NUMBERS = ['int32', 'int64', 'uint32', 'uint64', 'sint32', 'sint64', 'bool', 'enum', 'float', 'double'];
var varint = require('varint');

var encodeDouble = function(num) {
	var buf = new Buffer(8);
	buf.writeDoubleBE(num, 0);
	return buf;
};

var encodeBoolean = function(val) {
	return new Buffer(varint.encode(val ? 1 : 0));
};

var encodeField = function(field, type) {
	return new Buffer(varint.encode(field << 3 | type));
};

var encodeVarint = function(num) {
	return new Buffer(varint.encode(num));
};

var push = function(pool, val) {
	pool.push(val);
	return val.length;
};

var compile = function(schema) {
	var subtype = function(main) {
		if (!main.length) return function(obj, pool) { return 0; };
		return main
			.map(function(field, i) {
				var tag = field.tag || i;
				var key = field.name;

				var wrap = function(fn) {
					if (field.required) return fn;
					return function(obj, pool) {
						if (obj[key] === undefined || obj[key] === null) return 0;
						return fn(obj, pool);
					}
				};

				var ondouble = wrap(function(obj, pool) {
					return push(pool, encodeField(tag, 5)) + push(pool, encodeDouble(obj[key]));
				});

				var onboolean = wrap(function(obj, pool) {
					return push(pool, encodeBoolean(obj[key]));
				});

				var onvarint = wrap(function(obj, pool) {
					return push(pool, encodeField(tag, 0)) + push(pool, encodeVarint(obj[key]));
				});

				var onbytes = wrap(function(obj, pool) {
					var val = obj[key];
					return push(pool, encodeField(tag, 2)) + push(pool, encodeVarint(val.length)) + push(pool, val);
				});

				var onstring = wrap(function(obj, pool) {
					var val = new Buffer(obj[key]);
					return push(pool, encodeField(tag, 2)) + push(pool, encodeVarint(val.length)) + push(pool, val);
				});

				var onjson = wrap(function(obj, pool) {
					var val = new Buffer(JSON.stringify(obj[key]));
					return push(pool, encodeField(tag, 2)) + push(pool, encodeVarint(val.length)) + push(pool, val);
				});

				var onobject = function(type) {
					var enc = subtype(type.fields);

					return wrap(function(obj, pool) {
						var offset = push(pool, encodeField(tag, 2));
						var i = pool.push(null)-1;
						var len = enc(obj[key], pool);
						pool[i] = encodeVarint(len);
						return offset + pool[i].length + len;
					});
				};

				var onarray = function(type) {
					var enc = subtype(type.items);

					return wrap(function(obj, pool) {
						var offset = push(pool, encodeField(tag, 2));
						var i = pool.push(null)-1;
						var len = 0;

						obj[key].forEach(function(item) {
							len += enc(item, pool);
						});

						pool[i] = encodeVarint(len);
						return offset + pool[i].length + len;
					});
				};

				switch (field.type) {
					case 'int32':
					case 'int64':
					case 'uint32':
					case 'uint64':
					case 'sint32':
					case 'sint64':
					case 'enum':
					return onvarint;

					case 'float':
					case 'double':
					case 'number':
					return ondouble;

					case 'json':
					return onjson;

					case 'bytes':
					return onbytes;

					case 'string':
					return onstring;

					case 'bool':
					return onboolean;

					case 'object':
					return onobject(field);

					case 'array':
					return onarray(field);
				}

				throw new Error('Unsupported field type: '+field.type+' for '+field.name);
			})
			.reduce(function(a, b) {
				return function(obj, pool) {
					return a(obj, pool) + b(obj, pool);
				};
			});
	};

	var enc = subtype(schema);
	return function(obj) {
		var pool = [];
		var len = enc(obj, pool);
		return Buffer.concat(pool, len);
	};
};

module.exports = compile;