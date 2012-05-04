if(typeof module !== 'undefined') {
  var chai = require('chai');
  var scheemParse = require('../parser').scheemParse;
} 
var assert = chai.assert;

suite('Parser Tests', function() {
  test('parses lists into arrays', function() {
    assert.deepEqual(
      scheemParse("(atom)"),
      ['atom']
    );
  });
  test('parses lists with multiple items', function() {
    assert.deepEqual(
      scheemParse("(a b)"),
      ['a', 'b']
    );
  });
  test('parses nested lists', function() {
    assert.deepEqual(
      scheemParse("(a (b c) d)"),
      ['a', ['b', 'c'], 'd']
    );
  }); 
  test('handles extra whitespace', function() {
    assert.deepEqual(
      scheemParse(" ( a\t b ) "),
      ['a', 'b']
    );
  }); 
  test('handles newlines', function() {
    assert.deepEqual(
      scheemParse("(a\nb)"),
      ['a', 'b']
    );
  });
  test('handles quote in front of atoms', function() {
    assert.deepEqual(
      scheemParse("'a"),
      ['quote', 'a']
    );
  });
  test('handles quote in front of list', function() {
    assert.deepEqual(
      scheemParse("'(a b)"),
      ['quote', ['a', 'b']]
    );
  });
  test('handles comments on a line by themelves', function() {
    assert.deepEqual(
      scheemParse(";;first\n(a\n;;second\nb)\n;;third\n"),
      ['a', 'b']
    );
  });
  test('throws an error when input is malformed', function() {
    assert.throw(function() {
      scheemParse("(");
    });
  });
  test('parses integers', function() {
    assert.deepEqual(
      scheemParse("(12)"),
      [12]
    );
  });
  test('parses floats', function() {
    assert.deepEqual(
      scheemParse("(1.2)"),
      [1.2]
    );
  }); 
});
