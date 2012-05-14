if(typeof module !== 'undefined') {
  var chai = require('chai');
  var parse = require('../parser').parse;
} 
var assert = chai.assert;

suite('Parser Tests', function() {
  suite('Expressions', function() {
    suite('Numbers', function() {
      test('simple integer', function() {
        assert.deepEqual(
          parse("3;"),
          [ { tag: 'ignore', body: 3 } ]
        );
      });
      test('float', function() {
        assert.deepEqual(
          parse("23.6;"),
          [ { tag: 'ignore', body: 23.6 } ]
        );
      });
      test('negative number', function() {
        assert.deepEqual(
          parse("-333.07;"),
          [ { tag: 'ignore', body: -333.07 } ]
        );
      });
    });
    
    suite('Identifiers', function() {
      test('can start with lowercase characters', function() {
        assert.deepEqual(
          parse("a;"),
          [ { tag: 'ignore', body: {tag: 'ident', name: 'a'} } ]
        );
      });
      test('can start with uppercase characters', function() {
        assert.deepEqual(
          parse("A;"),
          [ {tag: 'ignore', body: {tag: 'ident', name: 'A' } } ]
        );
      });
      test('can start with underscore', function() {
        assert.deepEqual(
          parse("_;"),
          [ {tag: 'ignore', body: {tag: 'ident', name: '_' } } ]
        );
      });
      test('can contain lowercase, uppercase, underscore, or number', function() {
        assert.deepEqual(
          parse("abC_3;"),
          [ {tag: 'ignore', body: {tag: 'ident', name: 'abC_3' } } ]
        );
      });
      test('can not contain other characters', function() {
        assert.throws(function() {
          parse("abC!3;");
        });
      });
    });

    suite('Arithmetic', function() {
      test('multiplication with identifiers and numbers', function() {
        assert.deepEqual(
          parse("a * 3;"),
          [ {tag: 'ignore', body: {tag: '*', left: {tag: 'ident', name: 'a'}, right: 3 } } ]
        );
      });
      test('division with identifiers and numbers', function() {
        assert.deepEqual(
          parse("a / 3;"),
          [ {tag: 'ignore', body: {tag: '/', left: {tag: 'ident', name: 'a'}, right: 3 } } ]
        );
      });
      test('chained multiplication and division', function() {
        assert.deepEqual(
          parse("a / 3 * 4;"),
          [ {tag: 'ignore', body: {tag: '/', left: {tag: 'ident', name: 'a'}, right: {tag:'*', left: 3, right: 4 } } } ]
        );
      });
      test('addition with identifiers and numbers', function() {
        assert.deepEqual(
          parse("a + 3;"),
          [ {tag: 'ignore', body: {tag: '+', left: {tag: 'ident', name: 'a'}, right: 3 } } ]
        );
      });
      test('subtraction with identifiers and numbers', function() {
        assert.deepEqual(
          parse("a - 3;"),
          [ {tag: 'ignore', body: {tag: '-', left: {tag: 'ident', name: 'a'}, right: 3 } } ]
        );
      });
      test('chained addition and subtraction', function() {
        assert.deepEqual(
          parse("a + 3 - 4;"),
          [ {tag: 'ignore', body: {tag: '+', left: {tag: 'ident', name: 'a'}, right: {tag:'-', left: 3, right: 4 } } } ]
        );
      });
      test('multiplication binds tighter than addition', function() {
        assert.deepEqual(
          parse("a * 3 - 4;"),
          [ {tag: 'ignore', body: {tag: '-', left: {tag: '*', left: {tag: 'ident', name: 'a'}, right: 3 }, right: 4 } } ]
        );
      });
      test('parenthesis can change operator priority', function() {
        assert.deepEqual(
          parse("a * (3-4 );"),
          [ {tag: 'ignore', body: {tag: '*', left: {tag: 'ident', name: 'a'}, right: {tag: '-', left: 3, right: 4 } } } ]
        );
      });
    });
    suite('Comparison', function() {
      test('< with identifiers and numbers', function() {
        assert.deepEqual(
          parse("a < 3;"),
          [ {tag: 'ignore', body: {tag: '<', left: {tag: 'ident', name: 'a'}, right: 3 } } ]
        );
      });
      test('> with identifiers and numbers', function() {
        assert.deepEqual(
          parse("a > 3;"),
          [ {tag: 'ignore', body: {tag: '>', left: {tag: 'ident', name: 'a'}, right: 3 } } ]
        );
      });
      test('== with identifiers and numbers', function() {
        assert.deepEqual(
          parse("a == 3;"),
          [ {tag: 'ignore', body: {tag: '==', left: {tag: 'ident', name: 'a'}, right: 3 } } ]
        );
      });
      test('!= with identifiers and numbers', function() {
        assert.deepEqual(
          parse("a != 3;"),
          [ {tag: 'ignore', body: {tag: '!=', left: {tag: 'ident', name: 'a'}, right: 3 } } ]
        );
      });
      test('<= with identifiers and numbers', function() {
        assert.deepEqual(
          parse("a <= 3;"),
          [ {tag: 'ignore', body: {tag: '<=', left: {tag: 'ident', name: 'a'}, right: 3 } } ]
        );
      });
      test('>= with identifiers and numbers', function() {
        assert.deepEqual(
          parse("a >= 3;"),
          [ {tag: 'ignore', body: {tag: '>=', left: {tag: 'ident', name: 'a'}, right: 3 } } ]
        );
      });
      test('comparison ops are lowest priority', function() {
        assert.deepEqual(
          parse("a - 3 < b * 2;"),
          [ {tag: 'ignore', body: {tag: '<', left: {tag:'-', left: {tag: 'ident', name: 'a'}, right: 3 }, right: {tag: '*', left: {tag: 'ident', name: 'b'}, right: 2 } } } ]
        );
      });
    });

    suite('Function calls', function() {
      test('can be called with no args', function() {
        assert.deepEqual(
          parse("a12();"),
          [ {tag: 'ignore', body: {tag: 'call',  name: 'a12', args: [] } } ]
        );
      });
      test('can be called with one arg', function() {
        assert.deepEqual(
          parse("a12(1 + 2);"),
          [ {tag: 'ignore', body: {tag: 'call',  name: 'a12', args: [ {tag: '+', left: 1, right: 2 } ] } } ]
        );
      });
      test('can be called with more than one arg', function() {
        assert.deepEqual(
          parse("a12(1 + 2, 3, b()) ;"),
          [ {tag: 'ignore', body: {tag: 'call',  name: 'a12', args: [ {tag: '+', left: 1, right: 2 }, 3, {tag:'call', name: 'b', args: [] } ] } } ]
        );
      });
      test('arguments must be separated by commas', function() {
        assert.throws(function () {
          parse("a(1 2);");
        });
      });
      test('name is an identifier', function() {
        assert.throws(function() {
          parse("a!(1);");
        });
      });
    });
  });
  
  suite('Statements', function() {
    suite('Assignment', function() {
      test('variable := expression', function() {
        assert.deepEqual(
          parse("x := 3 + 4;"),
          [ {tag: ':=', left: 'x', right: {tag: '+', left: 3, right: 4}} ]
        );
      });
      test('variable must be valid identifier', function() {
        assert.throws(function() {
          parse("x! := 3;");
        });
      });
    });
 
    suite('Define', function() {
      test('function with no arguments and no body', function() {
        assert.deepEqual(
          parse("define f() { }"),
          [ { tag: 'define', name: 'f', args: [], body: [] } ]
        );
      });
      test('function with no arguments and one statement', function() {
        assert.deepEqual(
          parse("define f() { x := 3; }"),
          [ { tag: 'define', name: 'f', args: [], body: [ { tag: ':=', left: 'x', right: 3 } ] } ]
        );
      });
      test('function with no arguments and more than one statement', function() {
        assert.deepEqual(
          parse("define f() { x := 3; x; }"),
          [ { tag: 'define', name: 'f', args: [], body: [ { tag: ':=', left: 'x', right: 3 }, {tag: 'ignore', body: {tag: 'ident', name: 'x' } } ] } ]
        );
      });
      test('function with one arg and no body', function() {
        assert.deepEqual(
          parse("define f(x) { }"),
          [ { tag: 'define', name: 'f', args: ['x'], body: [] } ]
        );
      });
      test('function with more than one arg and no body', function() {
        assert.deepEqual(
          parse("define f(x, y) { }"),
          [ { tag: 'define', name: 'f', args: ['x', 'y'], body: [] } ]
        );
      });
      test('function with args and body', function() {
        assert.deepEqual(
          parse("define f(x, y) { z := x + y; 3; }"),
          [ { tag: 'define', name: 'f', args: ['x', 'y'], body: [ {tag: ':=', left: 'z', right: {tag: '+', left: {tag: 'ident', name: 'x' }, right: {tag: 'ident', name: 'y' }}}, {tag: 'ignore', body: 3} ] } ] 
        );
      });
      test('function name must be valid identifier', function() {
        assert.throws(function() {
          parse("define f!(x) { 1 + 1; }");
        });
      });
      test('argument names must be valid identifiers', function() {
        assert.throws(function() {
          parse("define f(x!) { 1 + 1; }");
        });
      });
    });
 
    suite('Declaration', function() {
      test('declare a variable', function() {
        assert.deepEqual(
          parse("var xa_1 ; "),
          [ { tag: 'var', name: 'xa_1' } ]
        );
      });
      test('variable must be a valid identifier', function() {
        assert.throws(function() {
          parse("var x!;");
        });
      });
    });

    suite('If', function() {
      test('with no statements', function() {
        assert.deepEqual(
          parse("if ( x == 1) {\n}"),
          [ { tag: 'if', expr: { tag: '==', left: {tag: 'ident', name: 'x'}, right: 1 }, body: [] } ]
        );
      });
      test('with statements', function() {
        assert.deepEqual(
          parse("if ( 1 < 2 ) { var x; x := 3; }"),
          [ { tag: 'if', expr: { tag: '<', left: 1, right: 2 }, body: [ { tag: 'var', name: 'x' }, { tag: ':=', left: 'x', right: 3 } ] } ]
        );
      });
      test('requires expression', function() {
        assert.throws(function() {
          parse("if () { }");
        });
      });
    });

    suite('Repeat', function() {
      test('with no statements', function() {
        assert.deepEqual(
          parse("repeat (3+4) { } "),
          [ { tag: 'repeat', expr: { tag: '+', left: 3, right: 4 }, body: [] } ]
        );
      });
      test('with statements', function() {
        assert.deepEqual(
          parse("repeat( 1 + 2 ) { var x; x := 3; }"),
          [ { tag: 'repeat', expr: { tag: '+', left: 1, right: 2 }, body: [ { tag: 'var', name: 'x' }, { tag: ':=', left: 'x', right: 3 } ] } ]
        );
      });
      test('requires expression', function() {
        assert.throws(function() {
          parse("repeat () { }");
        });
      });
    });
  });
});
