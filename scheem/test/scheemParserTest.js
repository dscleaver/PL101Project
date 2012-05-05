if(typeof module !== 'undefined') {
  var chai = require('chai');
  var parseScheem = require('../parser').parseScheem;
} 
var assert = chai.assert;

suite('Parser Tests', function() {
  test('parses lists into arrays', function() {
    assert.deepEqual(
      parseScheem("(atom)"),
      ['atom']
    );
  });
  test('parses lists with multiple items', function() {
    assert.deepEqual(
      parseScheem("(a b)"),
      ['a', 'b']
    );
  });
  test('parses nested lists', function() {
    assert.deepEqual(
      parseScheem("(a (b c) d)"),
      ['a', ['b', 'c'], 'd']
    );
  }); 
  test('handles extra whitespace', function() {
    assert.deepEqual(
      parseScheem(" ( a\t b ) "),
      ['a', 'b']
    );
  }); 
  test('handles newlines', function() {
    assert.deepEqual(
      parseScheem("(a\nb)"),
      ['a', 'b']
    );
  });
  test('handles quote in front of atoms', function() {
    assert.deepEqual(
      parseScheem("'a"),
      ['quote', 'a']
    );
  });
  test('handles quote in front of list', function() {
    assert.deepEqual(
      parseScheem("'(a b)"),
      ['quote', ['a', 'b']]
    );
  });
  test('handles comments on a line by themelves', function() {
    assert.deepEqual(
      parseScheem(";;first\n(a\n;;second\nb)\n;;third\n"),
      ['a', 'b']
    );
  });
  test('throws an error when input is malformed', function() {
    assert.throw(function() {
      parseScheem("(");
    });
  });
  test('parses integers', function() {
    assert.deepEqual(
      parseScheem("(12)"),
      [12]
    );
  });
  test('parses floats', function() {
    assert.deepEqual(
      parseScheem("(1.2)"),
      [1.2]
    );
  }); 
});
