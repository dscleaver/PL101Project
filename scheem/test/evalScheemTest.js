if(typeof module !== 'undefined') {
  var chai = require('chai');
  var evalScheem = require('../scheem').evalScheem;
} 
var assert = chai.assert;

suite('Eval Tests', function() {
  test('no matching operation for list throws exception', function() {
    assert.throws(function() {
      evalScheem(['unknown', 2, 3], {});
    });
  });

  suite('quote', function() {
    test('a number', function() {
      assert.deepEqual(
        evalScheem(['quote', 3], {}),
        3
      );
    });
    test('an atom', function() {
      assert.deepEqual(
        evalScheem(['quote', 'dog'], {}),
        'dog'
      );
    });
    test('a list', function() {
      assert.deepEqual(
        evalScheem(['quote', [1, 2, 3]], {}),
        [1, 2, 3]
      );
    });
    test('fails if not exactly one argument', function() {
      assert.throw(function() { 
        evalScheem(['quote', 1, 2], {}); 
      });
      assert.throw(function() { 
        evalScheem(['quote'], {}); 
      });
    });
  });

  suite('define', function() {
    test('creates a variable with the specified value', function() {
      var env = {};
      evalScheem(['define', 'x', 3], env);
      assert.deepEqual(
        env['x'],
        3
      );
    });
    test('returns zero as the result', function() {
      assert.deepEqual(
        evalScheem(['define', 'x', 3], {}),
        0
      );
    });
    test('fails if not exactly 2 arguments', function() {
      assert.throw(function() {
        evalScheem(['define'], {});
      });
      assert.throw(function() {
        evalScheem(['define', 'x', 2, 3], {});
      });
    });    
    test('fails if first argument is not a variable', function() {
      assert.throw(function() {
        evalScheem(['define', 1, 5], {});
      });
    });
    test('fails if variable already exists', function() {
      assert.throw(function() {
        evalScheem(['define', 'x', 1], { x: 2 });
      });
    });
  });

  suite('variable references', function() {
    test('evaluate to their value in the environment', function() {
      assert.deepEqual(
        evalScheem('x', { x: [1, 2, 3] }),
        [1,2,3]
      );
    });
    test('throw an exception if the variable is not bound', function() {
      assert.throw(function() {
        evalScheem('x', {});
      });
    });
  });

  suite('set!', function() {
    test('changes the value of a variable', function() {
      var env = { y: 5 };
      evalScheem(['set!', 'y', 10], env);
      assert.deepEqual(
        env['y'],
        10
      );
    });
    test('returns zero as the result', function() {
      assert.deepEqual(
        evalScheem(['set!', 'y', 10], { y: 5 }),
        0
      );
    });
    test('fails if the first argument is not a variable', function() {
      assert.throw(function() {
        evalScheem(['set!', ['y'], 5], { y: 10 });
      });
    });
    test('fails if the variable is not already defined', function() {
      assert.throw(function() {
        evalScheem(['set!', 'y', 5], {});
      });
    });
  });

  suite('+', function() {
    test('adds two numbers', function() {
      assert.deepEqual(
        evalScheem(['+', 5, 6], {}),
        11
      );
    });
    test('fails if not given two arguments', function() {
      assert.throw(function() {
        evalScheem(['+'], {});
      });
      assert.throw(function() {
        evalScheem(['+', 1, 2, 3], {});
      });
    });
    test('fails if arguments are not numbers', function() {
      assert.throw(function() {
        evalScheem(['+', ['quote', 'hey'], 3], {});
      });
      assert.throw(function() {
        evalScheem(['+', 1, ['quote', 'hey']], {});
      });
    });
  });

  suite('*', function() {
    test('multiplies two numbers', function() {
      assert.deepEqual(
        evalScheem(['*', 5, 6], {}),
        30
      );
    });
    test('fails if not given two arguments', function() {
      assert.throw(function() {
        evalScheem(['*'], {});
      });
      assert.throw(function() {
        evalScheem(['*', 1, 2, 3], {});
      });
    });
    test('fails if arguments are not numbers', function() {
      assert.throw(function() {
        evalScheem(['*', ['quote', 'hey'], 3], {});
      });
      assert.throw(function() {
        evalScheem(['*', 1, ['quote', 'hey']], {});
      });
    });
  });

  suite('-', function() {
    test('subtracts two numbers', function() {
      assert.deepEqual(
        evalScheem(['-', 6, 5], {}),
        1
      );
    });
    test('fails if not given two arguments', function() {
      assert.throw(function() {
        evalScheem(['-'], {});
      });
      assert.throw(function() {
        evalScheem(['-', 1, 2, 3], {});
      });
    });
    test('fails if arguments are not numbers', function() {
      assert.throw(function() {
        evalScheem(['-', ['quote', 'hey'], 3], {});
      });
      assert.throw(function() {
        evalScheem(['-', 1, ['quote', 'hey']], {});
      });
    });
  });

  suite('/', function() {
    test('divides two numbers', function() {
      assert.deepEqual(
        evalScheem(['/', 30, 5], {}),
        6
      );
    });
    test('fails if not given two arguments', function() {
      assert.throw(function() {
        evalScheem(['/'], {});
      });
      assert.throw(function() {
        evalScheem(['/', 1, 2, 3], {});
      });
    });
    test('fails if arguments are not numbers', function() {
      assert.throw(function() {
        evalScheem(['/', ['quote', 'hey'], 3], {});
      });
      assert.throw(function() {
        evalScheem(['/', 1, ['quote', 'hey']], {});
      });
    });
    test('fails if dividing by zero', function() {
      assert.throw(function() {
        evalScheem(['/', 2, 0], {});
      });
    });
  });

  suite('=', function() {
    test('returns #t if the two input expressions are equal', function() {
      assert.deepEqual(
        evalScheem(['=', 1, 1], {}),
        '#t'
      );
    });
    test('returns #f if the two input expressions are not equal', function() {
      assert.deepEqual(
        evalScheem(['=', 3, 4], {}),
        '#f'
      );
    });
    test('evaluates its arguments before comparison', function() {
      assert.deepEqual(
        evalScheem(['=', ['-', 2, 1], ['+', 0, 1]], {}),
        '#t' 
      );
    });
    test('works on arrays', function() {
      assert.deepEqual(
        evalScheem(['=', ['quote', [1, 2, [3, 4]]], ['quote', [1, 2, [3, 4]]]], {}),
        '#t'
      );
    });
    test('works on symbols', function() {
      assert.deepEqual(
        evalScheem(['=', ['quote', 'hey'], ['quote', 'hey']], {}),
        '#t'
      );
    });
    test('fails if not given two arguments', function() {
      assert.throw(function() {
        evalScheem(['=', 1, 2, 3], {});
      });
      assert.throw(function() {
        evalScheem(['=', 1], {});
      });
    });
  });

  suite('<', function() {
    test('returns #t if the first argument is less than the second', function() {
      assert.deepEqual(
        evalScheem(['<', 1, 2], {}),
        '#t'
      );
    });
    test('returns #f if the first argument is not less than the second', function() {
      assert.deepEqual(
        evalScheem(['<', 2, 1], {}),
        '#f'
      );
    });
    test('evaluates its arguments before comparison', function() {
      assert.deepEqual(
        evalScheem(['<', ['-', 2, 1], ['+', 1, 1]], {}),
        '#t'
      );
    });
    test('requires both arguments to be numbers', function() {
      assert.throw(function () {
        evalScheem(['<', ['quote', 'hey'], 2], {});
      });
      assert.throw(function () {
        evalScheem(['<', 2, ['quote', 'hey']], {});
      });
    });
    test('fails if not given two arguments', function() {
      assert.throw(function() {
        evalScheem(['<', 1, 2, 3], {});
      });
      assert.throw(function() {
        evalScheem(['<', 1], {});
      });
    });
  });

  suite('>', function() {
    test('returns #t if the first argument is greater than the second', function() {
      assert.deepEqual(
        evalScheem(['>', 2, 1], {}),
        '#t'
      );
    });
    test('returns #f if the first argument is not greater than the second', function() {
      assert.deepEqual(
        evalScheem(['>', 1, 2], {}),
        '#f'
      );
    });
    test('evaluates its arguments before comparison', function() {
      assert.deepEqual(
        evalScheem(['>', ['-', 3, 1], ['+', 0, 1]], {}),
        '#t'
      );
    });
    test('requires both arguments to be numbers', function() {
      assert.throw(function () {
        evalScheem(['>', ['quote', 'hey'], 2], {});
      });
      assert.throw(function () {
        evalScheem(['>', 2, ['quote', 'hey']], {});
      });
    });
    test('fails if not given two arguments', function() {
      assert.throw(function() {
        evalScheem(['>', 1, 2, 3], {});
      });
      assert.throw(function() {
        evalScheem(['>', 1], {});
      });
    });
  });

  suite('<=', function() {
    test('returns #t if the first argument is less than the second', function() {
      assert.deepEqual(
        evalScheem(['<=', 1, 2], {}),
        '#t'
      );
    });
    test('returns #t if the first argument equals the second', function() {
      assert.deepEqual(
        evalScheem(['<=', 1, 1], {}),
        '#t'
      );
    });
    test('returns #f if the first argument is not less than or equal to the second', function() {
      assert.deepEqual(
        evalScheem(['<=', 2, 1], {}),
        '#f'
      );
    });
    test('evaluates its arguments before comparison', function() {
      assert.deepEqual(
        evalScheem(['<=', ['-', 2, 1], ['+', 1, 1]], {}),
        '#t'
      );
    });
    test('requires both arguments to be numbers', function() {
      assert.throw(function () {
        evalScheem(['<=', ['quote', 'hey'], 2], {});
      });
      assert.throw(function () {
        evalScheem(['<=', 2, ['quote', 'hey']], {});
      });
    });
    test('fails if not given two arguments', function() {
      assert.throw(function() {
        evalScheem(['<=', 1, 2, 3], {});
      });
      assert.throw(function() {
        evalScheem(['<=', 1], {});
      });
    });
  });

  suite('>=', function() {
    test('returns #t if the first argument is greater than the second', function() {
      assert.deepEqual(
        evalScheem(['>=', 2, 1], {}),
        '#t'
      );
    });
    test('returns #t if the first argument is equal to the second', function() {
      assert.deepEqual(
        evalScheem(['>=', 1, 1], {}),
        '#t'
      );
    });
    test('returns #f if the first argument is not greater than or equal to the second', function() {
      assert.deepEqual(
        evalScheem(['>=', 1, 2], {}),
        '#f'
      );
    });
    test('evaluates its arguments before comparison', function() {
      assert.deepEqual(
        evalScheem(['>=', ['-', 3, 1], ['+', 0, 1]], {}),
        '#t'
      );
    });
    test('requires both arguments to be numbers', function() {
      assert.throw(function () {
        evalScheem(['>=', ['quote', 'hey'], 2], {});
      });
      assert.throw(function () {
        evalScheem(['>=', 2, ['quote', 'hey']], {});
      });
    });
    test('fails if not given two arguments', function() {
      assert.throw(function() {
        evalScheem(['>=', 1, 2, 3], {});
      });
      assert.throw(function() {
        evalScheem(['>=', 1], {});
      });
    });
  });

  suite('cons', function() {
    test('joins an element to the front of a list', function() {
      assert.deepEqual(
        evalScheem(['cons', 1, ['quote', [2, 3]]], {}),
        [1, 2, 3]
      );
    });
    test('evaluates its arguments before joining them', function() {
      assert.deepEqual(
        evalScheem(['cons', ['quote', 'hey'], ['quote', [2, 3]]], {}),
        ['hey', 2, 3]
      );
    });
    test('fails if the second argument is not a list', function() {
      assert.throw(function() {
        evalScheem(['cons', 1, 2], {});
      });
    });
  });

  suite('car', function() {
    test('returns the first element of a list', function() {
      assert.deepEqual(
        evalScheem(['car', ['quote', [1, 2, 3]]], {}),
        1
      );
    });
    test('fails if not given 1 argument', function() {
      assert.throw(function() {
        evalScheem(['car'], {});
      });
      assert.throw(function() {
        evalScheem(['car', ['quote', [1]], 2], {});
      });
    });
    test('fails if the argument is not a list', function() {
      assert.throw(function() {
        evalScheem(['car', 2], {});
      });
    });
    test('fails if the list is empty', function() {
      assert.throw(function() {
        evalScheem(['car', ['quote', []]], {});
      });
    });
  });

  suite('cdr', function() {
    test('returns all but the first element of a list', function() {
      assert.deepEqual(
        evalScheem(['cdr', ['quote', [1, 2, 3]]], {}),
        [2, 3]
      );
    });
    test('fails if not given 1 argument', function() {
      assert.throw(function() {
        evalScheem(['cdr'], {});
      });
      assert.throw(function() {
        evalScheem(['cdr', ['quote', [1]], 2], {});
      });
    });
    test('fails if the argument is not a list', function() {
      assert.throw(function() {
        evalScheem(['cdr', 2], {});
      });
    });
    test('fails if the list is empty', function() {
      assert.throw(function() {
        evalScheem(['cdr', ['quote', []]], {});
      });
    });
  });

  suite('if', function() {
    test('returns the value of the second expression if the first evaluates to #t', function() {
      assert.deepEqual(
        evalScheem(['if', ['=', 1, 1], 2, 1], {}),
        2
      );
    });
    test('returns the value of the third expression if the first evaluates to #f', function() {
      assert.deepEqual(
        evalScheem(['if', ['=', 1, 2], 2, 1], {}),
        1
      );
    });
    test('evaluates only the conditional and the chosen expressions', function() {
      var env = {};
      evalScheem(['if', ['=', 1, 1], ['define', 'x', 2], ['define', 'y', 3]], env);
      assert.deepEqual(undefined, env.y);
      env = {};
      evalScheem(['if', ['=', 1, 2], ['define', 'x', 2], ['define', 'y', 3]], env);
      assert.deepEqual(undefined, env.x);
    });
    test('fails if not given 3 arguments', function() {
      assert.throw(function() {
        evalScheem(['if', ['=', 1, 1]], {});
      });
      assert.throw(function() {
        evalScheem(['if',  ['=', 1, 2], ['define', 'x', 2], ['define', 'y', 3]], env);
      });
    });
    test('fails if the conditional does not evaluate to #t or #f', function() {
      assert.throw(function() {
        evalScheem(['if', 3, 4, 5], {});
      });
    });
  });

  suite('begin', function() {
    test('returns zero when given no arguments', function() {
      assert.deepEqual(
        evalScheem(['begin'], {}),
        0
      );
    });
    test('evaluates all of its arguments in order', function() {
      var env = {};
      evalScheem(['begin', ['define', 'x', 2], ['set!', 'x', 3]], env);
      assert.deepEqual(3, env.x);
    });
    test('returns the value of the last expression', function() {
      assert.deepEqual(
        evalScheem(['begin', 3, 4, 5], {}),
        5
      );
    });
  });
});
