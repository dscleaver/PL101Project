var PEG = require('pegjs');
var assert = require('assert');
var fs = require('fs'); // for loading files

fs.readFile('scheem.peg', 'ascii', function(err, data) {
  var parse = PEG.buildParser(data).parse;
    // Do a test
  console.log("Testing simple expression");
  assert.deepEqual(parse("(a b c)"), ["a", "b", "c"]);
 
  console.log("Testing nested expression");
  assert.deepEqual(parse("(a (b c) d)"), ["a", ["b", "c"], "d"]);

  console.log("Testing extra spaces");
  assert.deepEqual(parse("( a  b )"), ["a", "b"]);

  console.log("Testing newlines");
  assert.deepEqual(parse("(a\nb)"), ["a", "b"]);

  console.log("Testing tabs");
  assert.deepEqual(parse("(a\tb)"), ["a", "b"]);

  console.log("Testing quoting atoms");
  assert.deepEqual(parse("'a"), ["quote", "a"]);

  console.log("Testing quoting lists");
  assert.deepEqual(parse("'(a b)"), ["quote", ["a", "b"]]);

  console.log("Testing comments");
  assert.deepEqual(parse(";;first\n(a\n;;second\nb)\n;;third\n"), ["a", "b"]);
});

