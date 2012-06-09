if(typeof module !== 'undefined') {
  var chai = require('chai');
  var scheem = require('../scheem');
  var typeExpr = scheem.typeExpr;
  var lookup = scheem.lookup; 
} 
var assert = chai.assert;

var base = function(name) {
  return { tag: 'basetype', name: name };
};

var arrow = function(left, right) {
  return { tag: 'arrowtype', left: left, right: right };
};

var abs = function(name) {
  return { tag: 'abstype', name: name };
};

var unit = { tag: 'unittype' };

var list = function(type) { 
  return { tag: 'listtype', type: type }; 
};

var typed = function(expr, type) {
  return {
    tag: 'typeexpr',
    expr: expr,
    type: type
  };
};

suite('Type System Tests', function() {
  suite('Numbers', function() {
    test('integers are num', function() {
      assert.deepEqual(
        typeExpr(3),
        base('num')
      );
    });
    test('floats are num', function() {
      assert.deepEqual(
        typeExpr(2.5),
        base('num')
      );
    });
  });
  suite('Booleans', function() {
    test('#t is bool', function() {
      assert.deepEqual(
        typeExpr('#t'),
        base('bool')
      );
    });
    test('#f is bool', function() {
      assert.deepEqual(
        typeExpr('#f'),
        base('bool')
      );
    });
  });
  suite('Variables', function() {
    test('variable types are looked up in the context', function() {
      assert.deepEqual(
        typeExpr('x', { bindings: { x: base('num') }, outer: null }),
        base('num')
      );
      assert.deepEqual(
        typeExpr('y', { bindings: { y: base('bool') }, outer: null }),
        base('bool')
      );
    });
    test('Variables that cannot be found throw an error', function() {
      assert.throws(function() {
        typeExpr('x');
      });
    });
  });
  suite('If', function() {
    test('type of if is type of then and else portions', function() {
      assert.deepEqual(
        typeExpr(['if', '#t', 3, 4]),
        base('num')
      );
    });
    test('conditional must be bool or error occurs', function() {
      assert.throws(function() {
        typeExpr(['if', 3, 3, 4]);
      });
    });
    test('types of consequences must match', function() {
      assert.throws(function() {
        typeExpr(['if', '#t', 3, '#f']);
      });
    });
  });
  suite('Lambda', function() {
    test('adds arg types to context', function() {
      assert.deepEqual(
        typeExpr(['lambda', [typed('x', base('num'))], 'x']),
        arrow(base('num'), base('num'))
      );
    });
    test('represents multi arg functions as curried', function() {
      assert.deepEqual(
        typeExpr(['lambda', [typed('x', base('num')), typed('y', base('num'))], ['plus', 'x', 'y']], { bindings: { plus: arrow(base('num'), arrow(base('num'), base('num'))) } }),
        arrow(base('num'), arrow(base('num'), base('num')))
      );
    });
    test('fails to typecheck if the expression fails to typecheck', function() {
      assert.throws(function() {
        typeExpr(['lambda', [typed('x', base('num')), typed('y', base('bool'))], ['plus', 'x', 'y']], { bindings: { plus: arrow(base('num'), arrow(base('num'), base('num'))) } });
      });
    });
    test('using polymorphic function with defined types', function() {
      assert.deepEqual(
        typeExpr(['lambda', [typed('x', base('num')), typed('y', base('num'))], ['equal', 'x', 'y']], { bindings: { equal: arrow(abs('a'), arrow(abs('a'), base('bool'))) }, outer: null }),
        arrow(base('num'), arrow(base('num'), base('bool')))
      );
    });
    test('functions with abstract types can be checked', function() { 
      assert.deepEqual(
        typeExpr(['lambda', [typed('x', abs('b')), typed('y', abs('b'))], ['equal', 'x', 'y']], { bindings: { equal: arrow(abs('a'), arrow(abs('a'), base('bool'))) }, outer: null }),
        arrow(abs('b'), arrow(abs('b'), base('bool')))
      );
    });
    test('abstract type confirmation works on complex functions', function() {
      assert.deepEqual(
        typeExpr(['lambda', [typed('f', arrow(abs('a'), abs('b'))), typed('l', list(abs('a')))], ['f', ['car', 'l']]], { bindings: { car: arrow(list(abs('x')), abs('x')) }, outer: null }),
        arrow(arrow(abs('a'), abs('b')), arrow(list(abs('a')), abs('b')))
      );
    });
/*    test('infers types as best it can if not provided', function() {
      assert.deepEqual(
        typeExpr(['lambda', ['x', 'y'], ['plus', 'x', 'y']], { bindings: { plus: arrow(base('num'), arrow(base('num'), base('num'))) } }),
        arrow(base('num'), arrow(base('num'), base('num')))
      );
    });*/
  });
  suite('Typed Expression', function() {
    test('type checks if the expression matches the provided type', function() {
      assert.deepEqual(
        typeExpr(typed(1, base('num'))),
        base('num')
      );
    });
    test('fails if the expression does not match the provided type', function() {
      assert.throws(function() {
        typeExpr(typed(1, base('bool')));
      });
    });
  });
  suite('Function Application', function() {
    test('Binds type variables when applying functions', function() {
      assert.deepEqual(
        typeExpr(['equal', 1, 2], { bindings: { equal: arrow(abs('a'), arrow(abs('a'), base('bool'))) }, outer: null }),
        base('bool')
      );
    });
  });
});
