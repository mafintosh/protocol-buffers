'use strict'

module.exports = `message Bar {
  message Foo {
    optional uint32 baz = 1;
  }

  optional Foo tmp = 1;
}

enum FOO {
  LOL=1;
  ABE=3;
}

message Yo {
  repeated FOO lol = 1;
}

message Lol {
  optional string lol = 1;
  required Bar b = 2;
}

message Test {
  optional Lol meh = 6;
  optional uint32 hello = 3;
  optional string foo = 1;
  optional bytes payload = 7;
}`
