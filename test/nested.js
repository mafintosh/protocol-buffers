var tape = require('tape');
var path = require('path');
var protobuf = require('../');
var spec = require('fs').readFileSync(path.join(__dirname, 'nested.proto'));

tape('encode', function(t) {
	var schema = protobuf(spec);
	var b1 = schema.encode({
		num: 1,
		payload: new Buffer('lol'),
		meh: {
			num: 2,
			payload: new Buffer('bar')
		}
	});

	t.ok(b1);

	var b2 = schema.encode({
		num: 1,
		payload: new Buffer('lol'),
		meeeh: 42,
		meh: {
			num: 2,
			payload: new Buffer('bar')
		}
	});

	t.same(b2.length, b1.length);
	t.end();
});

tape('encode + decode', function(t) {
	var schema = protobuf(spec);
	var b1 = schema.encode({
		num: 1,
		payload: new Buffer('lol'),
		meh: {
			num: 2,
			payload: new Buffer('bar')
		}
	});

	var o1 = schema.decode(b1);

	t.same(o1.num, 1);
	t.same(o1.payload, new Buffer('lol'));
	t.ok(o1.meh);
	t.same(o1.meh.num, 2);
	t.same(o1.meh.payload, new Buffer('bar'));

	var b2 = schema.encode({
		num: 1,
		payload: new Buffer('lol'),
		meeeh: 42,
		meh: {
			num: 2,
			payload: new Buffer('bar')
		}
	});

	var o2 = schema.decode(b1);

	t.same(o2, o1);
	t.end();
});