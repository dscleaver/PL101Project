if(typeof module !== 'undefined') {
  var parse = require('./parser').parse;
  var continuations = require('./continuations.js');
  var thunk = continuations.thunk;
  var thunkValue = continuations.thunkValue;
}

var evalExpr = function(expr, env, cont) {
  if(typeof expr === 'number') {
    return thunk(cont, expr);
  }

  switch(expr.tag) {
    case '+':
      return numberOp(expr, env, cont, function(v1, v2) { return v1 + v2; });
    case '*':
      return numberOp(expr, env, cont, function(v1, v2) { return v1 * v2; });
    case '-':
      return numberOp(expr, env, cont, function(v1, v2) { return v1 - v2; });
    case '/':
      return numberOp(expr, env, cont, function(v1, v2) { 
        if(v2 === 0) { 
          throw "Division by zero"; 
        } 
        return v1 / v2; 
      });
    case '<':
      return numberOp(expr, env, cont, function(v1, v2) { return v1 < v2; });
    case '>':
      return numberOp(expr, env, cont, function(v1, v2) { return v1 > v2; });
    case '>=':
      return numberOp(expr, env, cont, function(v1, v2) { return v1 >= v2; });
    case '<=':
      return numberOp(expr, env, cont, function(v1, v2) { return v1 <= v2; });
    case '==':
      return numberOp(expr, env, cont, function(v1, v2) { return v1 === v2; });
    case '!=':
      return numberOp(expr, env, cont, function(v1, v2) { return v1 !== v2; });
    case 'ident':
      var val = lookup(env, expr.name);
      if(val === null) {
        throw "Variable " + expr.name + " not found.";
      }
      return thunk(cont, val);
    case 'call':
      var f = lookup(env, expr.name);
      var args = [];
      var i = 0;
      var evalArgs = function(arg) {
        args.push(arg);
        if(i === expr.args.length) {
          return f.apply(this, args);
        }
        return thunk(evalExpr, expr.args[i++], env, evalArgs);
      };
      return evalArgs(cont);
  }
};

var lookup = function(env, v) {
  if(env === null) {
    return null;
  }
  var val = env.bindings[v];
  if(typeof val !== 'undefined') {
    return val;
  }
  return lookup(env.outer, v);
}

var add_binding = function(env, v, val) {
  if(lookup(env, v) !== null) {
    throw "Variable " + v + " already defined.";
  } 
  env.bindings[v] = val;
};

var update = function(env, v, val) {
  if(env === null) {
    throw "Variable " + v + " not defined.";
  }
  if(typeof env.bindings[v] !== 'undefined') {
    env.bindings[v] = val;
    return 0;
  }
  return update(env.outer, v, val);
}

var numberOp = function(expr, env, cont, op) {
  return thunk(
    evalExpr, expr.left, env,
    function(v1) {
      return thunk(
        evalExpr, expr.right, env,
        function(v2) {
          if(typeof v1 !== 'number' || typeof v2 !== 'number') {
            throw "Arguments to " + expr.tag + " must be numbers";
          } 
          return thunk(cont, op(v1, v2));
        })
    });
};

var evalIf = function(statement, env, cont) {
  return evalExpr(statement.expr, env, function(cond) {
    if(typeof cond !== 'boolean') {
      throw "Conditions for if must be boolean";
    }
    if(cond) {
      return evalStatements(statement.body, env, cont);
    }
    return thunk(cont, undefined);
  });
};

var evalRepeat = function(statement, env, cont) {
  return evalExpr(statement.expr, env, function(num) {
    if(typeof num !== 'number') {
      throw "Repeat only accepts numbers";
    }
    if(num < 0) {
      throw "Repeat only accepts numbers >= 0";
    }
    var next = function(val) {
      if(num === 0) {
        return thunk(cont, val);
      }
      num--;
      return evalStatements(statement.body, env, next);
    }
    return next(undefined);
  });
};

var createFunction = function(statement, env) {
  return function(cont) {
    if(statement.args.length !== arguments.length - 1) {
      throw "Wrong number of arguments in call to " + statement.name + " expected " + statement.args.length + " received " + arguments.length;
    }
    var newenv = { bindings: {}, outer: env };
    for(var i = 0; i < statement.args.length; i++) {
      newenv.bindings[statement.args[i]] = arguments[i + 1];
    }  
    return evalStatements(statement.body, newenv, cont);
  };
};

var evalStatement = function(statement, env, cont) {
  switch(statement.tag) {
    case 'ignore':
      return evalExpr(statement.body, env, cont);
    case 'var':
      return evalExpr(statement.initial, env, function(val) {
        add_binding(env, statement.name, val);
        return thunk(cont, 0);
      });
    case ':=':
      return evalExpr(statement.right, env, function(val) {
        var value = update(env, statement.left, val);
        return thunk(cont, value);
      });
    case 'if':
      return evalIf(statement, env, cont);
    case 'repeat':
      return evalRepeat(statement, env, cont);
    case 'define':
      add_binding(env, statement.name, createFunction(statement, env));
      return thunk(cont, 0);
  }
};

var evalStatements = function(statements, env, cont) {
  var i = 0;
  var next = function(val) {
    if(i === statements.length) {
      return thunk(cont, val);
    }
    return thunk(evalStatement, statements[i++], env, next);
  };
  return next(undefined);
};

var stepStart = function(expr, env) {
  return {
    data: evalStatements(expr, env, thunkValue),
    done: false
  };
};

var step = function(state) {
  if(state.data.tag === "value") {
    state.done = true;
    state.data = state.data.val;
  } else if(state.data.tag === "thunk") {
    state.data = state.data.func.apply(null, state.data.args);
  } else {
    throw "Illegal state value";
  }
};

var evalState = function(state) {
  while(!state.done) {
    step(state);
  }
  return state.data;
};

var eval = function(expr, env, startState) {
  return evalState(stepStart(expr, env));
};

var evalString = function(expr, env) {
  return eval(parse(expr), env);
}

if(typeof module !== 'undefined') {
  module.exports.step = step;
  module.exports.eval = eval;
  module.exports.evalString = evalString;
}
