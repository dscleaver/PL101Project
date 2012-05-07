if(typeof module !== 'undefined') {
  var parseScheem = require('./parser').parseScheem;
}

var lookup = function (env, v) {
    if(env === null) {
      return null;
    }
    var val = env.bindings[v];
    if(typeof val !== 'undefined') {
      return val;
    }
    return lookup(env.outer, v);
};

var update = function (env, v, val) {
    if(env === null) {
      throw "Variable " + expr[1] + " is not defined";
    }
    var bound = env.bindings[v];
    if(typeof bound !== 'undefined') {
      env.bindings[v] = val;
    } else {
      update(env.outer, v, val);
    }
};

var add_binding = function (env, v, val) {
    env.bindings[v] = val;
};

var scheemSpecialForms = {};

var globalEnv = { bindings: {}, outer: null };

var evalScheem = function (expr, env) {
    env = env || { bindings: {}, outer: globalEnv };
    // Numbers evaluate to themselves
    if (typeof expr === 'number') {
        return expr;
    }
    if(typeof expr === 'string') {
      var value = lookup(env, expr);
      if(value === null) {
        throw "Variable " + expr + " is not defined.";
      }
      return value;
    }
    var specialForm = scheemSpecialForms[expr[0]];
    if(typeof specialForm === 'function') {
      return specialForm(expr, env);
    }
   
    var funct = evalScheem(expr[0], env);
    var args = [];
    for(var i = 1; i < expr.length; i++) {
      args.push(evalScheem(expr[i], env));
    }
    return funct.apply(this, args);    
};

var evalScheemString = function(expr, env) {
  return evalScheem(parseScheem(expr), env);
}

var specialFormArgLengthWrapper = function(func, argLength) {
  if(typeof argLength === 'undefined') {
    return func;
  }
  return function(expr, env) { 
    if(expr.length !== argLength + 1) {
      throw "Wrong number of arguments to " + expr[0] + " expected " + argLength + " and received " + (expr.length - 1);
    }
    return func(expr, env);
  };
};

var addSpecialForm = function(name, func, argLength) {
  scheemSpecialForms[name] = specialFormArgLengthWrapper(func, argLength);
}

addSpecialForm('quote', function(expr, env) {
  return expr[1];
}, 1);

addSpecialForm('define', function(expr, env) {
  if(typeof expr[1] !== 'string') {
    throw "The first argument to define must be a variable but was " + JSON.stringify(expr[1]);
  }
  if(lookup(env, expr[1]) !== null) {
    throw expr[1] + " is already defined.";
  }
  var val = evalScheem(expr[2], env);
  if(typeof val === 'function') {
    val.meta.name = expr[1];
  }
  add_binding(env, expr[1], val);
  return 0;
}, 2);

addSpecialForm('set!', function(expr, env) {
  if(typeof expr[1] !== 'string') {
    throw "The first argument to set! must be a variable but was " + JSON.stringify(expr[1]);
  }
  update(env, expr[1], evalScheem(expr[2], env));
  return 0;
}, 2);

addSpecialForm('if', function(expr, env) {
  var cond = evalScheem(expr[1], env);
  if(cond === '#t') return evalScheem(expr[2], env);
  if(cond !== '#f') {
    throw "First argument to if must be a boolean value was " + JSON.stringify(cond);
  }
  return evalScheem(expr[3], env);
}, 3);

addSpecialForm('begin', function(expr, env) {
  var result = 0;
  for(var i = 1; i < expr.length; i++) {
    result = evalScheem(expr[i], env);
  }
  return result;
});

addSpecialForm('lambda', function(expr, env) {
  var args = expr[1];
  if(!Array.isArray(args)) {
    throw "The first argument to lambda must be a list of arguments";
  }
  var body = expr[2];
  var meta = { name: "function" };
  var func = function() {
    if(arguments.length !== args.length) {
      throw "Wrong number of arguments to " + meta.name + " expected " + args.length + " and received " + arguments.length;
    }
    var functionEnv = { bindings: {}, outer: env };
    for(var i = 0; i < arguments.length; i++) {
      functionEnv.bindings[args[i]] = arguments[i];
    }
    return evalScheem(body, functionEnv);
  };
  func.meta = meta;
  return func;
}, 2);

var argLengthWrapper = function(name, func, argLength) {
  return function() {
    if(arguments.length !== argLength) {
      throw "Wrong number of arguments to " + name + " expected " + argLength + " and received " + arguments.length;
    }
    return func.apply(this, arguments);
  };
}
    
var define = function(name, func, argLength) {
  var wrapped = argLengthWrapper(name, func, argLength);
  wrapped.meta = { name: name };
  globalEnv.bindings[name] = wrapped;
}

var addNumberOp = function(name, op) {
  define(name, function(v1, v2) {
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

define('=', function(v1, v2) {
  if(deepEqual(v1, v2)) return '#t';
  return '#f';
}, 2);

var addNumComparisonOp = function(name, op) {
  define(name, function(v1, v2) {
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

define('cons', function(element, list) {
  if(!(list instanceof Array)) {
    throw "The second argument to cons must be a list was " + JSON.stringify(list);
  }
  return [ element ].concat(list);
}, 2);

define('car', function(list) {
  if(!(list instanceof Array)) {
    throw "The argument to car must be a list was " + JSON.stringify(list);
  }
  if(list.length === 0) {
    throw "Can not call car on an empty list";
  }
  return list[0];
}, 1);

define('cdr', function(list) {
  if(!(list instanceof Array)) {
    throw "The argument to cdr must be a list was " + JSON.stringify(list);
  }
  if(list.length === 0) {
    throw "Can not call cdr on an empty list";
  }
  return list.slice(1);
}, 1);

define('alert', function(v) {
  var toShow = prettyPrint(v);
  if(typeof module !== 'undefined') {
    console.log(toShow);
  } else {
    window.alert(toShow);
  }
}, 1);

if(typeof module !== 'undefined') {
  module.exports.evalScheem = evalScheem;
  module.exports.evalScheemString = evalScheemString;
  module.exports.lookup = lookup;
  module.exports.globalEnv = globalEnv;
}
