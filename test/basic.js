var tape = require('tape');
var path = require('path');
var protobuf = require('../');

var addTests = function(spec) {
	tape('encode', function(t) {
		var schema = protobuf(spec);
		var b1 = schema.encode({
			num: 1,
			payload: new Buffer('lol')
		});

		t.ok(b1);

		var b2 = schema.encode({
			num: 1,
			payload: new Buffer('lol'),
			meeeh: 42
		});

		t.same(b2.length, b1.length);
		t.end();
	});

	tape('encode + decode', function(t) {
		var schema = protobuf(spec);
		var b1 = schema.encode({
			num: 1,
			payload: new Buffer('lol')
		});

		var o1 = schema.decode(b1);

		t.same(o1.num, 1);
		t.same(o1.payload, new Buffer('lol'));


		var b2 = schema.encode({
			num: 1,
			payload: new Buffer('lol'),
			meeeh: 42
		});

		var o2 = schema.decode(b1);

		t.same(o2, o1);
		t.end();
	});

	tape('encode + decode floats', function(t) {
		var schema = protobuf(spec);
		var b1 = schema.encode({
			num: 1.1,
			payload: new Buffer('lol')
		});

		var o1 = schema.decode(b1);

		t.same(o1.num, 1.1);
		t.same(o1.payload, new Buffer('lol'));
		t.end();
	});
};

addTests(require('./basic.json'));
addTests(require('fs').readFileSync(path.join(__dirname, 'basic.proto')));