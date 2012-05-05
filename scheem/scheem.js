if(typeof module !== 'undefined') {
  var parseScheem = require('./parser').parseScheem;
}

var scheemBuiltins = {};

evalScheem = function (expr, env) {
    // Numbers evaluate to themselves
    if (typeof expr === 'number') {
        return expr;
    }
    if(typeof expr === 'string') {
      var value = env[expr];
      if(typeof value === 'undefined') {
        throw "Variable " + expr + " is not defined";
      }
      return value;
    }
    var builtin = scheemBuiltins[expr[0]];
    if(typeof builtin === 'function') {
      var argLength = builtin['argLength'];
      if(typeof argLength !== 'undefined' && expr.length !== argLength + 1) {
        throw "Wrong number of arguments to " + expr[1] + " expected " + argLength + " and received " + (expr.length - 1);
      }
      return builtin(expr, env);
    }
    throw "Unknown operation " + expr[0];
};

evalScheemString = function(expr, env) {
  return evalScheem(parseScheem(expr), env);
}

var addBuiltin = function(name, func, argLength) {
  func.argLength = argLength;
  scheemBuiltins[name] = func;
}

addBuiltin('quote', function(expr, env) {
  return expr[1];
}, 1);

addBuiltin('define', function(expr, env) {
  if(typeof expr[1] !== 'string') {
    throw "The first argument to define must be a variable but was " + JSON.stringify(expr[1]);
  }
  if(typeof env[expr[1]] !== 'undefined') {
    throw expr[1] + " is already defined.";
  } 
  env[expr[1]] = evalScheem(expr[2], env);
  return 0;
}, 2);

addBuiltin('set!', function(expr, env) {
  if(typeof expr[1] !== 'string') {
    throw "The first argument to set! must be a variable but was " + JSON.stringify(expr[1]);
  }
  if(typeof env[expr[1]] === 'undefined') {
    throw "Variable " + expr[1] + " is not defined";
  }
  env[expr[1]] = evalScheem(expr[2], env);
  return 0;
}, 2);

var addNumberOp = function(name, op) {
  addBuiltin(name, function(expr, env) {
    var v1 = evalScheem(expr[1], env); 
    var v2 = evalScheem(expr[2], env);
    if(typeof v1 !== 'number' || typeof v2 !== 'number') {
      throw "Arguments to " + name + " must be numbers, given " + JSON.stringify(v1) + " and " + JSON.stringify(v2);;
    }
    return op(v1, v2);
  }, 2);
};

addNumberOp('+', function(v1, v2) { return v1 + v2; });
addNumberOp('*', function(v1, v2) { return v1 * v2; });
addNumberOp('-', function(v1, v2) { return v1 - v2; });
addNumberOp('/', function(v1, v2) { 
  if(v2 === 0) {
    throw "Can not divide by zero"
  }
  return v1 / v2; 
});

var deepEqual = function(v1, v2) {
  if(v1 === v2) {
    return true;
  }
  console.log(typeof v1);
  if(v1 instanceof Array && v2 instanceof Array && v1.length === v2.length) {
    for(var i = 0; i < v1.length; i++) {
      if(!deepEqual(v1[i], v2[i])) {
        return false;
      }
      return true;
    }
  }
  return false;
};

addBuiltin('=', function(expr, env) {
  var v1 = evalScheem(expr[1], env);
  var v2 = evalScheem(expr[2], env);
  if(deepEqual(v1, v2)) return '#t';
  return '#f';
}, 2);

var addNumComparisonOp = function(name, op) {
  addBuiltin(name, function(expr, env) {
    var v1 = evalScheem(expr[1], env);
    var v2 = evalScheem(expr[2], env);
    if(typeof v1 !== 'number' || typeof v2 !== 'number') {
      throw "Arguments to " + name + " must be numbers, given " + JSON.stringify(v1) + " and " + JSON.stringify(v2);
    }
    if(op(v1, v2)) return '#t';
    return '#f';
  }, 2);
};  

addNumComparisonOp('<', function(v1, v2) { return v1 < v2; });
addNumComparisonOp('>', function(v1, v2) { return v1 > v2; });
addNumComparisonOp('<=', function(v1, v2) { return v1 <= v2; });
addNumComparisonOp('>=', function(v1, v2) { return v1 >= v2; });

addBuiltin('cons', function(expr, env) {
  var element = evalScheem(expr[1], env);
  var list = evalScheem(expr[2], env);
  if(!(list instanceof Array)) {
    throw "The second argument to cons must be a list was " + JSON.stringify(list);
  }
  return [ element ].concat(list);
}, 2);

addBuiltin('car', function(expr, env) {
  var list = evalScheem(expr[1], env);
  if(!(list instanceof Array)) {
    throw "The argument to car must be a list was " + JSON.stringify(list);
  }
  if(list.length === 0) {
    throw "Can not call car on an empty list";
  }
  return list[0];
}, 1);

addBuiltin('cdr', function(expr, env) {
  var list = evalScheem(expr[1], env);
  if(!(list instanceof Array)) {
    throw "The argument to cdr must be a list was " + JSON.stringify(list);
  }
  if(list.length === 0) {
    throw "Can not call cdr on an empty list";
  }
  return list.slice(1);
}, 1);

addBuiltin('if', function(expr, env) {
  var cond = evalScheem(expr[1], env);
  if(cond === '#t') return evalScheem(expr[2], env);
  if(cond !== '#f') {
    throw "First argument to if must be a boolean value was " + JSON.stringify(cond);
  }
  return evalScheem(expr[3], env);
}, 3);

scheemBuiltins['begin'] = function(expr, env) {
  var result = 0;
  for(var i = 1; i < expr.length; i++) {
    result = evalScheem(expr[i], env);
  }
  return result;
}

if(typeof module !== 'undefined') {
  module.exports.evalScheem = evalScheem;
}
