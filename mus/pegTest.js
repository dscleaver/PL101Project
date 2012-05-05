var PEG = require('pegjs');
var assert = require('assert');
var fs = require('fs'); // for loading files

function note(pitch, duration) {
  return { tag: "note", pitch: pitch, dur: duration };
}

function rest(duration) {
  return { tag: "rest", duration: duration };
}

function sequence(left, right) {
  return { tag: "seq", left: left, right: right };
}

function parallel(left, right) {
  return { tag: "par", left: left, right: right };
}

function repeat(section, times) {
  return { tag: "repeat", section: section, count: times };
}

var a1 = note("a1", 10);
var b2 = note("b2", 50);
var c3 = note("c3", 60);

fs.readFile('mus.peg', 'ascii', function(err, data) {
  var parse = PEG.buildParser(data).parse;
    // Do a test
  console.log("Test one note");
  assert.deepEqual(parse("a0[300]"), note("a0", 300));

  console.log("Test bad pitch");
  assert.throws(function() { parse("g8[500]"); });

  console.log("Test no duration");
  assert.throws(function() { parse("a4[]"); });

  console.log("Test no duration block");
  assert.throws(function() { parse("a4"); });

  console.log("Test whitespace before and after note");
  assert.deepEqual(parse(" a1[10] "), a1);

  console.log("Test rest");
  assert.deepEqual(parse("[100]"), rest(100));

  console.log("Test bad rest format");
  assert.throws(function () { parse("[a]") });

  console.log("Test sequence of two notes");
  assert.deepEqual(parse("a1[10] b2[50]"), sequence(a1, b2));

  console.log("Test sequence of three notes");
  assert.deepEqual(parse("a1[10] b2[50]  c3[60]"), sequence(a1, sequence(b2, c3)));

  console.log("Test parallel notes");
  assert.deepEqual(parse("a1[10] | b2[50]"), parallel(a1, b2));  

  console.log("Test sequence is higher priority than parallel");
  assert.deepEqual(parse("a1[10] b2[50] | c3[60]"), parallel(sequence(a1, b2), c3));

  console.log("Test parenthesis");
  assert.deepEqual(parse("a1[10] (b2[50] | c3[60])"), sequence(a1, parallel(b2, c3))); 

  console.log("Test repeat on note");
  assert.deepEqual(parse("a1[10] * 4"), repeat(a1, 4));

  console.log("Test repeat on sequence");
  assert.deepEqual(parse("(a1[10] b2[50]) * 5"), repeat(sequence(a1, b2), 5));

  console.log("Test repeat on parallel in sequence");
  assert.deepEqual(parse("a1[10] (b2[50] | c3[60])*6"), sequence(a1, repeat(parallel(b2, c3), 6)));
});

