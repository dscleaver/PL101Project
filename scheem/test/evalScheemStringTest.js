if(typeof module !== 'undefined') {
  var chai = require('chai');
  var evalScheem = require('../scheem').evalScheem;
} 
var assert = chai.assert;

suite('Eval Scheem String Tests', function() {
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
      evalScheemString("(* x x)", { x:4 }),
      16
    );
  });
});
