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

var deduceType = function(val, nested) {
	if (Buffer.isBuffer(val)) return 'bytes';
	if (nested && Array.isArray(val)) return 'array';

	var t = typeof val;

	switch (t) {
		case 'boolean': return 'bool';
		case 'number':  return 'double';
		case 'object':  return 'json';
		case 'string':  return 'string';
	}

	throw new Error('Unknown type: '+t);
};

module.exports = function(schema, opts) {
	if (!opts) opts = {};

	var main = opts.main;
	var ignore = opts.ignore;

	if (Buffer.isBuffer(schema) || typeof schema === 'string') schema = parse(schema, main);

	var that = {};
	var types = {};

	that.encode = encoder(schema);
	that.decode = decoder(schema);

	schema.forEach(function(field) {
		types[field.name] = field.type;
	});

	that.validate = function(obj) {
		var keys = Object.keys(obj);
		for (var i = 0; i < keys.length; i++) {
			var key = keys[i];
			if (!types[key]) continue;
			if (types[key] !== deduceType(obj[key])) return false;
		}
		return true;
	};

	that.mergeFromObject = function(obj) {
		var keys = Object.keys(obj);
		var sch = [];

		for (var i = 0; i < keys.length; i++) {
			var val = obj[keys[i]];

			if (val === null || val === undefined) continue;
			if (ignore && ignore.indexOf(keys[i]) > -1) continue;

			sch.push({
				name: keys[i],
				type: deduceType(obj[keys[i]], false)
			});
		}

		return that.merge(sch);
	};

	that.merge = function(otherSchema, opts) {
		var strict = opts && opts.strict;
		var updated = 0;

		if (strict) {
			for (var i = 0; i < otherSchema.length; i++) {
				var f = otherSchema[i];
				if (i >= schema.length) {
					schema.push(f);
					types[f.name] = f.type;
					updated++;
					continue;
				}
				var existing = schema[i];
				if (existing.name !== f.name) return -1;
				if (existing.type !== f.type) return -1;
			}
		} else {
			for (var i = 0; i < otherSchema.length; i++) {
				var f = otherSchema[i];
				if (types[f.name]) {
					if (types[f.name] !== f.type) return -1;
					continue;
				}
				types[f.name] = f.type;
				schema.push(f);
				updated++;
			}
		}

		if (!updated) return 0;

		that.encode = encoder(schema);
		that.decode = decoder(schema);

		return updated;
	};

	that.toJSON = function() {
		return schema.fields;
	};

	that.createEncodeStream = function() {
		return new Transformer(that.encode);
	};

	that.createDecodeStream = function() {
		return new Transformer(that.decode);
	};

	return that;
};