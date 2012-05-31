if(typeof module !== 'undefined') {
  var chai = require('chai');
  var parse = require('../parser').parse;
} 
var assert = chai.assert;

var assertAST = function(expr, expected) {
  assert.deepEqual(parse(expr), expected);
};

suite('Parser Tests', function() {
  suite('Nil process', function() {
    test('returns empty list', function() {
      assertAST(' () ', { tag: 'nil' });
    });
  });
  suite('Send', function() {
    test('simple send', function() {
      assertAST(
        'x!y . ()',
        { tag: '!', channel: 'x', value: 'y', next: { tag: 'nil' } }
      );
    });
    test('channel name and variable value can be letters, numbers, and underscore', function() {
      assertAST(
        'x1_f3!y4gf.()',
        { tag: '!', channel: 'x1_f3', value: 'y4gf', next: { tag: 'nil' } }
      );
    });
    test('send can send empty tuple', function() {
      assertAST(
        'x![].()',
        { tag: '!', channel: 'x', value: [], next: { tag: 'nil' } }
      );
    });
    test('send can send a full tuple', function() {
      assertAST(
        'x![a b []].()',
        { tag: '!', channel: 'x', value: ['a', 'b', []], next: { tag: 'nil' } }
      );
    });
    test('chained sends', function() {
      assertAST(
        'x!y.y!z.z!w.()',
        { tag: '!', channel: 'x', value: 'y', next: { tag: '!', channel: 'y', value: 'z', next: { tag: '!', channel: 'z', value: 'w', next: { tag: 'nil' } } } }
      );
    });
  });
  suite('Receive', function() {
    test('simple receive', function() {
      assertAST(
        'x?y . ()',
        { tag: '?', channel: 'x', value: 'y', next: { tag: 'nil' } }
      );
    });
    test('channel name and variable value can be letters, numbers, and underscore', function() {
      assertAST(
        'x1_f3?y4gf.()',
        { tag: '?', channel: 'x1_f3', value: 'y4gf', next: { tag: 'nil' } }
      );
    });
    test('chained receives', function() {
      assertAST(
        'x?y.y?z.z?w.()',
        { tag: '?', channel: 'x', value: 'y', next: { tag: '?', channel: 'y', value: 'z', next: { tag: '?', channel: 'z', value: 'w', next: { tag: 'nil' } } } }
      );
    });
    test('receive can receive empty tuple', function() {
      assertAST(
        'x?[].()',
        { tag: '?', channel: 'x', value: [], next: { tag: 'nil' } }
      );
    });
    test('receive can receive a full tuple', function() {
      assertAST(
        'x?[a b []].()',
        { tag: '?', channel: 'x', value: ['a', 'b', []], next: { tag: 'nil' } }
      );
    });
  });
  suite('Replicating Receive', function() {
    test('replicating receive', function() {
      assertAST(
        'x?*y . ()',
        { tag: '?*', channel: 'x', value: 'y', next: { tag: 'nil' } }
      );
    });
    test('channel name and variable value can be letters, numbers, and underscore', function() {
      assertAST(
        'x1_f3?*y4gf.() ',
        { tag: '?*', channel: 'x1_f3', value: 'y4gf', next: { tag: 'nil' } }
      );
    });
    test('chained receives', function() {
      assertAST(
        'x?*y.y?z.z?*w.()',
        { tag: '?*', channel: 'x', value: 'y', next: { tag: '?', channel: 'y', value: 'z', next: { tag: '?*', channel: 'z', value: 'w', next: { tag: 'nil' } } } }
      );
    });
    test('can receive empty tuple', function() {
      assertAST(
        'x?*[].()',
        { tag: '?*', channel: 'x', value: [], next: { tag: 'nil' } }
      );
    });
    test('can receive a full tuple', function() {
      assertAST(
        'x?*[a b []].()',
        { tag: '?*', channel: 'x', value: ['a', 'b', []], next: { tag: 'nil' } }
      );
    });
  });
  suite('New', function() {
    test('simple new', function() {
      assertAST(
        'new( x ) . ()',
        { tag: 'new', channel: 'x', next: { tag: 'nil' } }
      );
    });
    test('channel name and variable value can be letters, numbers, and underscore', function() {
      assertAST(
        'new(xd4_78t).()',
        { tag: 'new', channel: 'xd4_78t', next: { tag: 'nil' } }
      );
    });
    test('chained new', function() {
      assertAST(
        'new(x).new(y).()',
        { tag: 'new', channel: 'x', next: { tag: 'new', channel: 'y', next: { tag: 'nil' } }}
      );
    });
  });
  suite('Parallel Processes', function() {
    test('separate parallel processes with a pipe', function() {
      assertAST(
        'x!z.() | x?y.()',
        { tag: '|', left:{ tag: '!', channel: 'x', value: 'z', next: { tag: 'nil' } }, right:{ tag: '?', channel: 'x', value: 'y', next: { tag: 'nil' } } }
      );
    });
    test('can go in sequence if parenthesis are used', function() {
      assertAST(
        'new(x).(x!z.()|x?y.())',
        { tag: 'new', channel: 'x', next: { tag: '|', left:{ tag: '!', channel: 'x', value: 'z', next: { tag: 'nil' } }, right:{ tag: '?', channel: 'x', value: 'y', next: { tag: 'nil' } } } }
      );
    });
    test('multiple parallels in a row', function() {
      assertAST(
        '()|()|()',
        { tag: '|', left: { tag: 'nil' }, right: { tag: '|', left: { tag: 'nil' }, right: { tag: 'nil' } }}
      );
    });
  });
});
