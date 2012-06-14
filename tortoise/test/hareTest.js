if(typeof module !== 'undefined') {
  var chai = require('chai');
  var hare = require('../hare');
  var evalCompiled = hare.evalCompiled;
  var compileString = hare.compileString;
} 
var assert = chai.assert;
var compileAndEval = function(str, env) {
  return evalCompiled(compileString(str), env);
};    

suite('Compile Tests', function() {
  suite('Expressions', function() {
    test('numbers eval to themselves', function() {
      assert.deepEqual(
        compileAndEval("3.56;"),
        3.56
      );
    });
    suite('addition', function() {
      test('functions properly', function() {
        assert.deepEqual(
          compileAndEval("3 + 4;"),
          7
        );
      });
      test('evals arguments', function() {
        assert.deepEqual(
          compileAndEval("(1 + 3) + (2 + 2);"),
          8
        );
      });
    });
    suite('multiplication', function() {
      test('functions properly', function() {
        assert.deepEqual(
          compileAndEval("3 * 4;"),
          12
        );
      });
      test('evals arguments', function() {
        assert.deepEqual(
          compileAndEval("(1 + 3) * (2 + 2);"),
          16
        );
      });
    });
    suite('subtraction', function() {
      test('functions properly', function() {
        assert.deepEqual(
          compileAndEval("3 - 4;"),
          -1
        );
      });
      test('evals arguments', function() {
        assert.deepEqual(
          compileAndEval("(1 + 3) - (2 + 2);"),
          0
        );
      });
    });
    suite('division', function() {
      test('functions properly', function() {
        assert.deepEqual(
          compileAndEval("8 / 2;"),
          4
        );
      });
      test('evals arguments', function() {
        assert.deepEqual(
          compileAndEval("(1 + 3) / (2 + 2);"),
          1
        );
      });
    });
    suite('less than', function() {
      test('functions properly', function() {
        assert.deepEqual(
          compileAndEval("1 < 2;"),
          true
        );
        assert.deepEqual(
          compileAndEval("2 < 1;"),
          false
        );
      });
      test('evals arguments', function() {
        assert.deepEqual(
          compileAndEval("(1 + 2) < (2 + 2);"),
          true
        );
      });
    });
    suite('greater than', function() {
      test('functions properly', function() {
        assert.deepEqual(
          compileAndEval("1 > 2;"),
          false
        );
        assert.deepEqual(
          compileAndEval("2 > 1;"),
          true
        );
      });
      test('evals arguments', function() {
        assert.deepEqual(
          compileAndEval("(1 + 2) > (1 + 1);"),
          true
        );
      });
    });
    suite('greater than or equal to', function() {
      test('functions properly', function() {
        assert.deepEqual(
          compileAndEval("1 >= 2;"),
          false
        );
        assert.deepEqual(
          compileAndEval("2 >= 1;"),
          true
        );
        assert.deepEqual(
          compileAndEval("1 >= 1;"),
          true
        );
      });
      test('evals arguments', function() {
        assert.deepEqual(
          compileAndEval("(1 + 2) >= (1 + 1);"),
          true
        );
      });
    });
    suite('less than or equal to', function() {
      test('functions properly', function() {
        assert.deepEqual(
          compileAndEval("1 <= 2;"),
          true
        );
        assert.deepEqual(
          compileAndEval("2 <= 1;"),
          false
        );
        assert.deepEqual(
          compileAndEval("1 <= 1;"),
          true
        );
      });
      test('evals arguments', function() {
        assert.deepEqual(
          compileAndEval("(1 + 2) <= (2 + 2);"),
          true
        );
      });
    });
    suite('equal to', function() {
      test('functions properly', function() {
        assert.deepEqual(
          compileAndEval("1 == 1;"),
          true
        );
        assert.deepEqual(
          compileAndEval("2 == 1;"),
          false
        );
      });
      test('evals arguments', function() {
        assert.deepEqual(
          compileAndEval("(1 + 2) == (0 + 3);"),
          true
        );
      });
    });
    suite('not equal to', function() {
      test('functions properly', function() {
        assert.deepEqual(
          compileAndEval("1 != 1;"),
          false
        );
        assert.deepEqual(
          compileAndEval("2 != 1;"),
          true
        );
      });
      test('evals arguments', function() {
        assert.deepEqual(
          compileAndEval("(1 + 2) != (1 + 3);"),
          true
        );
      });
    });
    suite('variables', function() {
      test('return value from environment', function() {
        assert.deepEqual(
          compileAndEval("x;", { bindings: { x: 5 }, outer: null }),
          5
        );
      });
      test('fails when variable not found', function() {
        assert.throws(function() {
          compileAndEval("x;", { bindings: { y: 3 }, outer: null });
        });
      });
    });
    suite('function calls', function() {
      test('looked up in environment', function() {
        assert.deepEqual(
          compileAndEval("f();", { bindings: { f: function() { return 7; } }, outer: null }),
          7
        );
      });
      test('pass args to function', function() {
        assert.deepEqual(
          compileAndEval("f(1 + 2, 3, 4 * 6);", { bindings: { f: function(x, y, z) { return [x, y, z]; } }, outer: null }),
          [ 3, 3, 24 ]
        );
      });
    });
  });
  suite('Statements', function() {
    suite('Declare', function() {
      test('declares a new variable in the environment', function() {
        assert.deepEqual(
          compileAndEval("var x; x + 1;"),
          1
        ); 
      });
      test('returns 0', function() {
        assert.deepEqual(
          compileAndEval("var y;"),
          0
        );
      });
      test('evaluates initial argument', function() {
        assert.deepEqual(
          compileAndEval("var x := 1 + 3; x;"),
          4
        );
      }); 
    });
    suite('Assignment', function() {
      test('sets the value of a variable', function() {
        assert.deepEqual(
          compileAndEval("x := 2 + 4; x;", { bindings: { x: 3 }, outer: null }),
          6
        );
      });
      test('returns assigned value', function() {
        assert.deepEqual(
          compileAndEval("y := 4;", { bindings: { y: 4 }, outer: null }),
          4
        );
      });
    });
    suite('If', function() {
      test('when condition is true, evaluates one statement and returns result', function() {
        assert.deepEqual(
          compileAndEval("if(1 < 2) { 4 + 5; }"),
          9
        );
      });
      test('when condition is true, evaluates all statements and returns result from last one', function() {
        assert.deepEqual(
          compileAndEval("if(1 < 2) { var x; x := 4; x + 6; }", { bindings: {}, outer: null }),
          10
        );
      });
      test('when condition is false, evaluates nothing', function() {
        var env = { bindings: { y: 7 }, outer: null }
        assert.isUndefined(compileAndEval("if(3 < 2) { y:=8;4 + 5; }", env));
        assert.deepEqual(env.bindings.y, 7);
      });
    });
    suite('Repeat', function() {
      test('execute one statement, once', function() {
        var env = { bindings: { x: 0 }, outer: null };
        assert.deepEqual(
          compileAndEval("repeat(1) { x := x + 1; }", env),
          1
        );
      });
      test('execute multiple statements, n times return value of statements', function() {
        assert.deepEqual(
          compileAndEval("repeat(1 + 2) { x := x + 1; }", { bindings: { x: 0 }, outer: null }),
          3
        );
      });
    });
    suite('Define', function() {
      test('defines a function in the environment', function() {
        var env = { bindings: {}, outer: null };
        var val = compileAndEval("define f() {} f;", env);
        assert.deepEqual(typeof val, 'function');
      });
      test('defined function evals statements in new environment when called', function() {
        var env = { bindings: {}, outer: null };
        assert.deepEqual(
          compileAndEval("define f() { var x; x := 1; x; } f();", env),
          1
        );
      });
      test('captures defining environment', function() {
        var env = { bindings: { v: 5 }, outer: null };
        assert.deepEqual(
          compileAndEval("define g() { v := v + 1; } g(); v;", env),
          6
        );
      });        
      test('binds arguments in environment', function() {
        var env = { bindings: { }, outer: null };
        assert.deepEqual(
          compileAndEval("define h(a, b) { a + b; } h(3,4);", env),
          7
        );
      });
    });
    suite('Multiple statements', function() {
      test('All statements are run', function() {
        var env = { bindings: {}, outer: null };
        assert.deepEqual(
          compileAndEval("var foo; foo := 3; foo;", env),
          3
        );
      });
      test('Define a function then call it', function() {
        assert.deepEqual(
          compileAndEval("define f(a, b) { a + b; } f(2, f(1, 3));", { bindings: {}, outer: null }),
          6
        );
      });
      test('Recursion', function() {
        assert.deepEqual(
          compileAndEval("define fact(n) { var ans; ans := 1; if(n > 1) { ans := n * fact(n - 1); } ans; } fact(5);", { bindings: {}, outer: null }),
          120
        );
      });
    });
  });
}); 
