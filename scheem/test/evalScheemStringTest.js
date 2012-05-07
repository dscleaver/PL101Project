if(typeof module !== 'undefined') {
  var chai = require('chai');
  var evalScheemString = require('../scheem').evalScheemString;
} 
var assert = chai.assert;

suite('Eval String Tests', function() {
  test('parse errors are propagated', function() {
    assert.throw(function() {
      evalScheemString("(+ 3", {});
    });
  });
  test('eval errors are propagated', function() {
    assert.throw(function() {
      evalScheemString("(+ 'hey 2)", {});
    });
  });
  test('result of evaluation is returned', function() {
    assert.deepEqual(
      evalScheemString("(+ 1 (* 2 3))", {}),
      7
    );
  });
  test('environment is passed to eval', function() {
    assert.deepEqual(
      evalScheemString("(* x x)", { name: 'x', value:4, outer: null }),
      16
    );
  });
  test('passing a function as a value to another function', function() {
    assert.deepEqual(
      evalScheemString("((lambda (f) (f 3)) (lambda (x) (+ x 1)))"),
      4
    );
  });
  test('inner function using values from enclosing function', function() {
    assert.deepEqual(
      evalScheemString("(((lambda (x) (lambda (y) (+ x y))) 4) 3)"),
      7
    );
  });
  test('argument to function shadows a global variable', function() {
    assert.deepEqual(
      evalScheemString("(begin (define x 3) ((lambda (x) x) 4))"),
      4
    );
  });
  test('function modifies a global variable', function() {
    assert.deepEqual(
      evalScheemString("(begin (define x 4) ((lambda () (set! x 5))) x)"),
      5
    );
  });
  test('inner function modifies a variable in the outer function', function() {
    assert.deepEqual(
      evalScheemString("(begin (define counter ((lambda (start) (lambda () (begin (set! start (+ start 1)) start))) 0)) (counter) (counter))"),
      2
    );
  });
  test('recursive functions', function() {
    assert.deepEqual(
      evalScheemString("(begin (define fact (lambda (x) (if (= x 1) 1 (* x (fact (- x 1)))))) (fact 3))"),
      6
    );
  });
});
