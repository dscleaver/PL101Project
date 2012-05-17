if(typeof module !== 'undefined') {
  var chai = require('chai');
  var tortoise = require('../tortoise');
  var eval = tortoise.eval;
  var evalString = tortoise.evalString;
} 
var assert = chai.assert;

suite('Eval Tests', function() {
  suite('Expressions', function() {
    test('numbers eval to themselves', function() {
      assert.deepEqual(
        evalString("3.56;"),
        3.56
      );
    });
    suite('addition', function() {
      test('functions properly', function() {
        assert.deepEqual(
          evalString("3 + 4;"),
          7
        );
      });
      test('evals arguments', function() {
        assert.deepEqual(
          evalString("(1 + 3) + (2 + 2);"),
          8
        );
      });
      test('requires arguments be numbers', function() {
        assert.throws(function() {
          evalString("(1 < 2) + 3;");
        });
        assert.throws(function() {
          evalString("3 + ( 1 < 2);");
        });
      });
    });
    suite('multiplication', function() {
      test('functions properly', function() {
        assert.deepEqual(
          evalString("3 * 4;"),
          12
        );
      });
      test('evals arguments', function() {
        assert.deepEqual(
          evalString("(1 + 3) * (2 + 2);"),
          16
        );
      });
      test('requires arguments be numbers', function() {
        assert.throws(function() {
          evalString("(1 < 2) * 3;");
        });
        assert.throws(function() {
          evalString("3 * ( 1 < 2);");
        });
      });
    });
    suite('subtraction', function() {
      test('functions properly', function() {
        assert.deepEqual(
          evalString("3 - 4;"),
          -1
        );
      });
      test('evals arguments', function() {
        assert.deepEqual(
          evalString("(1 + 3) - (2 + 2);"),
          0
        );
      });
      test('requires arguments be numbers', function() {
        assert.throws(function() {
          evalString("(1 < 2) - 3;");
        });
        assert.throws(function() {
          evalString("3 - ( 1 < 2);");
        });
      });
    });
    suite('division', function() {
      test('functions properly', function() {
        assert.deepEqual(
          evalString("8 / 2;"),
          4
        );
      });
      test('evals arguments', function() {
        assert.deepEqual(
          evalString("(1 + 3) / (2 + 2);"),
          1
        );
      });
      test('requires arguments be numbers', function() {
        assert.throws(function() {
          evalString("(1 < 2) / 3;");
        });
        assert.throws(function() {
          evalString("3 / ( 1 < 2);");
        });
      });
      test('errors on divide by zero', function() {
        assert.throws(function() {
          evalString("1/0;");
        });
      });
    });
    suite('less than', function() {
      test('functions properly', function() {
        assert.deepEqual(
          evalString("1 < 2;"),
          true
        );
        assert.deepEqual(
          evalString("2 < 1;"),
          false
        );
      });
      test('evals arguments', function() {
        assert.deepEqual(
          evalString("(1 + 2) < (2 + 2);"),
          true
        );
      });
      test('requires arguments be numbers', function() {
        assert.throws(function() {
          evalString("(1 < 2) < 3;");
        });
        assert.throws(function() {
          evalString("3 < ( 1 < 2);");
        });
      });
    });
    suite('greater than', function() {
      test('functions properly', function() {
        assert.deepEqual(
          evalString("1 > 2;"),
          false
        );
        assert.deepEqual(
          evalString("2 > 1;"),
          true
        );
      });
      test('evals arguments', function() {
        assert.deepEqual(
          evalString("(1 + 2) > (1 + 1);"),
          true
        );
      });
      test('requires arguments be numbers', function() {
        assert.throws(function() {
          evalString("(1 < 2) > 3;");
        });
        assert.throws(function() {
          evalString("3 > ( 1 < 2);");
        });
      });
    });
    suite('greater than or equal to', function() {
      test('functions properly', function() {
        assert.deepEqual(
          evalString("1 >= 2;"),
          false
        );
        assert.deepEqual(
          evalString("2 >= 1;"),
          true
        );
        assert.deepEqual(
          evalString("1 >= 1;"),
          true
        );
      });
      test('evals arguments', function() {
        assert.deepEqual(
          evalString("(1 + 2) >= (1 + 1);"),
          true
        );
      });
      test('requires arguments be numbers', function() {
        assert.throws(function() {
          evalString("(1 < 2) >= 3;");
        });
        assert.throws(function() {
          evalString("3 >= ( 1 < 2);");
        });
      });
    });
    suite('less than or equal to', function() {
      test('functions properly', function() {
        assert.deepEqual(
          evalString("1 <= 2;"),
          true
        );
        assert.deepEqual(
          evalString("2 <= 1;"),
          false
        );
        assert.deepEqual(
          evalString("1 <= 1;"),
          true
        );
      });
      test('evals arguments', function() {
        assert.deepEqual(
          evalString("(1 + 2) <= (2 + 2);"),
          true
        );
      });
      test('requires arguments be numbers', function() {
        assert.throws(function() {
          evalString("(1 < 2) <= 3;");
        });
        assert.throws(function() {
          evalString("3 <= ( 1 < 2);");
        });
      });
    });
    suite('equal to', function() {
      test('functions properly', function() {
        assert.deepEqual(
          evalString("1 == 1;"),
          true
        );
        assert.deepEqual(
          evalString("2 == 1;"),
          false
        );
      });
      test('evals arguments', function() {
        assert.deepEqual(
          evalString("(1 + 2) == (0 + 3);"),
          true
        );
      });
      test('requires arguments be numbers', function() {
        assert.throws(function() {
          evalString("(1 < 2) == 3;");
        });
        assert.throws(function() {
          evalString("3 == ( 1 < 2);");
        });
      });
    });
    suite('not equal to', function() {
      test('functions properly', function() {
        assert.deepEqual(
          evalString("1 != 1;"),
          false
        );
        assert.deepEqual(
          evalString("2 != 1;"),
          true
        );
      });
      test('evals arguments', function() {
        assert.deepEqual(
          evalString("(1 + 2) != (1 + 3);"),
          true
        );
      });
      test('requires arguments be numbers', function() {
        assert.throws(function() {
          evalString("(1 < 2) != 3;");
        });
        assert.throws(function() {
          evalString("3 != ( 1 < 2);");
        });
      });
    });
    suite('variables', function() {
      test('return value from environment', function() {
        assert.deepEqual(
          evalString("x;", { bindings: { x: 5 }, outer: null }),
          5
        );
      });
      test('search environments for value', function() {
        assert.deepEqual(
          evalString("x;", { bindings: { y: 4 }, outer: { bindings: { x: 3 }, outer: null } }),
          3
        );
      });
      test('returns first found value', function() {
        assert.deepEqual(
          evalString("x;", { bindings: { x: 4}, outer: { bindings: { x: 3 }, outer: null } }),
          4
        );
      });
      test('fails when variable not found', function() {
        assert.throws(function() {
          evalString("x;", { bindings: { y: 3 }, outer: null });
        });
      });
    });
    suite('function calls', function() {
      test('looked up in environment', function() {
        assert.deepEqual(
          evalString("f();", { bindings: { f: function() { return 7; } }, outer: null }),
          7
        );
      });
      test('pass args to function', function() {
        assert.deepEqual(
          evalString("f(1 + 2, 3, 4 * 6);", { bindings: { f: function(x, y, z) { return [x, y, z]; } }, outer: null }),
          [ 3, 3, 24 ]
        );
      });
    });
  });
  suite('Statements', function() {
    suite('Declare', function() {
      test('declares a new variable in the environment', function() {
        var env = { bindings: {}, outer: null };
        evalString("var x;", env);
        assert.deepEqual(env.bindings.x, 0);
      });
      test('returns 0', function() {
        assert.deepEqual(
          evalString("var y;", { bindings: {}, outer: null }),
          0
        );
      });
      test('fails if variable already defined in environment', function() {
        assert.throws(function() {
          evalString("var x;", { bindings: { x: 0 }, outer: null });
        });
        assert.throws(function() {
          evalString("var z;", { bindings: {}, outer: { bindings: { z: 1 }, outer: null } });
        });
      });
    });
    suite('Assignment', function() {
      test('sets the value of a variable', function() {
        var env = { bindings: { x: 4 }, outer: null };
        evalString("x := 2 + 4;", env);
        assert.deepEqual(env.bindings.x, 6);
      });
      test('returns 0', function() {
        assert.deepEqual(
          evalString("y := 4;", { bindings: { y: 4 }, outer: null }),
          0
        );
      });
      test('sets the variable in the first environment its defined in', function() {
        var env = { bindings: { }, outer: { bindings: { z: 7 }, outer: { bindings: { z: 6 }, outer: null }}};
        evalString("z := 23; ", env);
        assert.deepEqual(env.outer.bindings.z, 23);
        assert.deepEqual(env.outer.outer.bindings.z, 6);
      });
      test('fails if the variable is not defined', function() {
        assert.throws(function() {
          evalString("x := 5.5;", { bindings: {}, outer: null });
        });
      });
    });
    suite('If', function() {
      test('when condition is true, evaluates one statement and returns result', function() {
        assert.deepEqual(
          evalString("if(1 < 2) { 4 + 5; }"),
          9
        );
      });
      test('when condition is true, evaluates all statements and returns result from last one', function() {
        assert.deepEqual(
          evalString("if(1 < 2) { var x; x := 4; x + 6; }", { bindings: {}, outer: null }),
          10
        );
      });
      test('when condition is false, evaluates nothing', function() {
        var env = { bindings: { y: 7 }, outer: null }
        assert.isUndefined(evalString("if(3 < 2) { y:=8;4 + 5; }", env));
        assert.deepEqual(env.bindings.y, 7);
      });
      test('fails if condition is not boolean', function() {
        assert.throws(function() {
          evalString("if( 1 + 2) { }");
        });
      });
    });
    suite('Repeat', function() {
      test('execute one statement, once', function() {
        var env = { bindings: { x: 0 }, outer: null };
        evalString("repeat(1) { x := x + 1; }", env);
        assert.deepEqual(env.bindings.x, 1);
      });
      test('execute multiple statements, n times return value of statements', function() {
        assert.deepEqual(
          evalString("repeat(1 + 2) { x := x + 1; x; }", { bindings: { x: 0 }, outer: null }),
          3
        );
      });
      test('fails if expression does not return a number', function() {
        assert.throws(function() {
          evalString("repeat(1 < 2) {}");
        });
      });
      test('fails if number is not greater than or equal to 0', function() {
        assert.throws(function() {
          evalString("repeat(1 - 2) {}");
        });
      });
    });
    suite('Define', function() {
      test('defines a function in the environment', function() {
        var env = { bindings: {}, outer: null };
        evalString("define f() {}", env);
        assert.deepEqual(typeof env.bindings.f, 'function');
      });
      test('defined function evals statements in new environment when called', function() {
        var env = { bindings: {}, outer: null };
        evalString("define f() { var x; x := 1; x; }", env);
        assert.deepEqual(
          env.bindings.f(),
          1
        );
        assert.isUndefined(env.bindings.x);
      });
      test('captures defining environment', function() {
        var env = { bindings: { v: 5 }, outer: null };
        evalString("define g() { v := v + 1; }", env);
        env.bindings.g();
        assert.deepEqual(env.bindings.v, 6);
      });        
      test('binds arguments in environment', function() {
        var env = { bindings: { }, outer: null };
        evalString("define h(a, b) { a + b; }", env);
        assert.deepEqual(
          env.bindings.h(3, 4),
          7
        );
      });
      test('fails if identifier already defined', function() {
        assert.throws(function() {
          evalString("define func() {}", { bindings: {func: 3}, outer: null});
        });
      });
      test('enforces number of arguments', function() {
        var env = { bindings: { }, outer: null };
        evalString("define h(a, b) { a + b; }", env);
        assert.throws(function() {
          env.bindings.h(1);
        });
        assert.throws(function() {
          env.bindings.h(1,2,3);
        });
      });      
    });
    suite('Multiple statements', function() {
      test('All statements are run', function() {
        var env = { bindings: {}, outer: null };
        assert.deepEqual(
          evalString("var foo; foo := 3; foo;", env),
          3
        );
      });
      test('Define a function then call it', function() {
        assert.deepEqual(
          evalString("define f(a, b) { a + b; } f(2, f(1, 3));", { bindings: {}, outer: null }),
          6
        );
      });
      test('Recursion', function() {
        assert.deepEqual(
          evalString("define fact(n) { var ans; ans := 1; if(n > 1) { ans := n * fact(n - 1); } ans; } fact(5);", { bindings: {}, outer: null }),
          120
        );
      });
    });
  });
});

