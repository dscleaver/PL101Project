if(typeof module !== 'undefined') {
  var chai = require('chai');
  var parser = require('../parser');
  var parse = parser.parse;
} 
var assert = chai.assert;

var assertProcessAST = function(expr, expected) {
  assert.deepEqual(parse(expr, 'process'), expected);
};

var assertAST = function(expr, expected) {
  assert.deepEqual(parse(expr), expected);
};

suite('Parser Tests', function() {
  var nil = {tag: 'nil'};

  var send = function(channel, value, next) {
    if(typeof next === 'undefined') {
      next = nil;
    }
    return { tag: '!', channel: channel, value: value, next: next };
  };

  var receive = function(channel, value, next) {
    if(typeof next === 'undefined') {
      next = nil;
    }
    return { tag: '?', channel: channel, value: value, next: next };
  };

  var repeatReceive = function(channel, value, next) {
    if(typeof next === 'undefined') {
      next = nil;
    }
    return { tag: '?*', channel: channel, value: value, next: next };
  };

  var newChan = function(channel, next) {
    if(typeof next === 'undefined') {
      next = nil;
    }
    return { tag: 'new', channel: channel, next: next };
  };

  var par = function(left, right) {
    return { tag: '|', left: left, right: right };
  };

  var run = function(process, next) {
    if(typeof next === 'undefined') {
      next = nil;
    }
    return { tag: 'run', process: process, next: next };
  };

  var def = function(channels, processes, next) {
    if(typeof next === 'undefined') {
      next = nil;
    }
    return { tag: 'def', channels: channels, processes: processes, next: next };
  };

  var ifThenElse = function(cond, trueProcess, falseProcess) {
    return { tag: 'if', condition: cond, whenTrue: trueProcess, whenFalse: falseProcess };
  };

  suite('Nil process', function() {
    test('returns nil tag', function() {
      assertProcessAST('()', nil);
    });
  });
  suite('Booleans', function() {
    test('true parses to true', function() {
      assertProcessAST(
        'x!true',
        send('x', true)
      );
    });
    test('false parses to false', function() {
      assertProcessAST(
        'x!false',
        send('x', false)
      );
    });
  });
  suite('Numbers', function() {
    test('Simple integer', function() {
      assertProcessAST(
        'x!1', 
        send('x', 1)
      );
    });
    test('Larger integers', function() {
      assertProcessAST(
        'x!103',
        send('x', 103)
      );
    });
    test('Zero', function() {
      assertProcessAST(
        'x!0',
        send('x', 0)
      );
    });
  });
  suite('if then else', function() {
    test('parses', function() {
      assertProcessAST(
        'if true then x!y else x!z',
        ifThenElse(true, send('x', 'y'), send('x', 'z'))
      );
    });
    test('as part of a process', function() {
      assertProcessAST(
        'x!y. if b then x!z else x!t',
        send('x', 'y', ifThenElse('b', send('x', 'z'), send('x', 't')))
      );
    });
  });
  suite('Send', function() {
    test('simple send', function() {
      assertProcessAST(
        'x!y . ()',
        send('x', 'y')
      );
    });
    test('channel name and variable value can be letters, numbers, and underscore', function() {
      assertProcessAST(
        'x1_f3!y4gf.()',
        send('x1_f3', 'y4gf')
      );
    });
    test('send can send empty tuple', function() {
      assertProcessAST(
        'x![].()',
        send('x', [])
      );
    });
    test('send can send a full tuple', function() {
      assertProcessAST(
        'x![a b []].()',
        send('x', ['a', 'b', []])
      );
    });
    test('chained sends', function() {
      assertProcessAST(
        'x!y.y!z.z!w.()',
        send('x', 'y', send('y', 'z', send('z', 'w')))
      );
    });
  });
  suite('Receive', function() {
    test('simple receive', function() {
      assertProcessAST(
        'x?y = ()',
        receive('x', 'y')
      );
    });
    test('channel name and variable value can be letters, numbers, and underscore', function() {
      assertProcessAST(
        'x1_f3?y4gf = ()',
        receive('x1_f3', 'y4gf')
      );
    });
    test('chained receives', function() {
      assertProcessAST(
        'x?y = y?z = z?w = ()',
        receive('x', 'y', receive('y', 'z', receive('z', 'w')))
      );
    });
    test('receive can receive empty tuple', function() {
      assertProcessAST(
        'x?[] = ()',
        receive('x', [])
      );
    });
    test('receive can receive a full tuple', function() {
      assertProcessAST(
        'x?[a b []] = ()',
        receive('x', ['a', 'b', []])
      );
    });
  });
  suite('Replicating Receive', function() {
    test('replicating receive', function() {
      assertProcessAST(
        'x?*y = ()',
        repeatReceive('x', 'y')
      );
    });
    test('channel name and variable value can be letters, numbers, and underscore', function() {
      assertProcessAST(
        'x1_f3?*y4gf = ()',
        repeatReceive('x1_f3', 'y4gf')
      );
    });
    test('chained receives', function() {
      assertProcessAST(
        'x?*y = y?z = z?*w = ()',
        repeatReceive('x', 'y', receive('y', 'z', repeatReceive('z', 'w')))
      );
    });
    test('can receive empty tuple', function() {
      assertProcessAST(
        'x?*[] = ()',
        repeatReceive('x', [])
      );
    });
    test('can receive a full tuple', function() {
      assertProcessAST(
        'x?*[a b []] =\n()',
        repeatReceive('x', ['a', 'b', []])
      );
    });
  });
  suite('New', function() {
    test('simple new', function() {
      assertAST(
        'new x',
        newChan('x')
      );
    });
    test('channel name and variable value can be letters, numbers, and underscore', function() {
      assertAST(
        'new xd4_78t',
        newChan('xd4_78t')
      );
    });
    test('chained new', function() {
      assertAST(
        'new x new y',
        newChan('x', newChan('y'))
      );
    });
  });
  suite('Parallel Processes', function() {
    test('separate parallel processes with a pipe', function() {
      assertProcessAST(
        '(x!z.() | x?y = ())',
        par(send('x', 'z'), receive('x', 'y'))
      );
    });
    test('can go in sequence if parenthesis are used', function() {
      assertProcessAST(
        't!x.(x!z.()|x?y = ())',
        send('t', 'x', par(send('x', 'z'),receive('x', 'y')))
      );
    });
    test('multiple parallels in a row', function() {
      assertProcessAST(
        '(()|()|())',
        par(nil, par(nil, nil))
      );
    });
  });
  suite('Declarations', function() {
    test('run before a process', function() {
      assertProcessAST(
        '(run x!y z!t)',
        run(send('x', 'y'), send('z', 't'))
      );
    });
    test('chan before a process', function() {
      assertProcessAST(
        '(new x x?y = ())',
        newChan('x', receive('x', 'y'))
      );
    });
    test('single def before a process', function() {
      assertProcessAST(
        '(def plus[a b c] = a?x = () plus![x x x])',
        def(['plus'], [repeatReceive('plus', ['a','b','c'], receive('a', 'x'))], send('plus', ['x', 'x', 'x']))
      );
    });
    test('recursive def before a process', function() {
      assertProcessAST(
        '(def p[a] = a?x = () and s[b] = b![] p![x])',
        def(['p', 's'], [ repeatReceive('p', [ 'a' ], receive('a', 'x')), repeatReceive('s', [ 'b' ], send('b', []))], send('p', [ 'x' ]) )
      );
    });
    test('multiple declarations before a process', function() {
      assertProcessAST(
        '(new x run x!y x?z = z![])',
        newChan('x', run(send('x', 'y'), receive('x', 'z', send('z', []))))
      );
    });
  });
  suite('Definition', function() {
    test('simple def', function() {
      assertAST(
        'def x[y] = y!x',
        def(['x'], [ repeatReceive('x', ['y'], send('y', 'x')) ])
      );
    });
    test('recursive defs', function() {
      assertAST(
        'def x[y] = y!x and z[t] = t?r = ()',
        def(['x', 'z'], [ repeatReceive('x', ['y'], send('y', 'x')), repeatReceive('z', ['t'], receive('t', 'r')) ])
      );
    });
    test('multiple defs', function() {
      assertAST(
        'def x[y] = y!x\ndef z[t] = t?r = ()',
        def(['x'], [ repeatReceive('x', ['y'], send('y', 'x')) ], def(['z'], [repeatReceive('z', ['t'], receive('t', 'r'))]))
      );
    });
    test('def followed by run', function() {
      assertAST(
        'def x[y] = y!x run x!z',
        def(['x'], [ repeatReceive('x', ['y'], send('y', 'x')) ], run(send('x', 'z')))
      );
    });  
  });
});
