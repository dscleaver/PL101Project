if(typeof module !== 'undefined') {
  var parse = require('./parser').parse;
}

var evalExpr = function(expr, env) {
  if(typeof expr === 'number') {
    return expr;
  }

  switch(expr.tag) {
    case '+':
      return numberOp(expr, env, function(v1, v2) { return v1 + v2; });
    case '*':
      return numberOp(expr, env, function(v1, v2) { return v1 * v2; });
    case '-':
      return numberOp(expr, env, function(v1, v2) { return v1 - v2; });
    case '/':
      return numberOp(expr, env, function(v1, v2) { 
        if(v2 === 0) { 
          throw "Division by zero"; 
        } 
        return v1 / v2; 
      });
    case '<':
      return numberOp(expr, env, function(v1, v2) { return v1 < v2; });
    case '>':
      return numberOp(expr, env, function(v1, v2) { return v1 > v2; });
    case '>=':
      return numberOp(expr, env, function(v1, v2) { return v1 >= v2; });
    case '<=':
      return numberOp(expr, env, function(v1, v2) { return v1 <= v2; });
    case '==':
      return numberOp(expr, env, function(v1, v2) { return v1 === v2; });
    case '!=':
      return numberOp(expr, env, function(v1, v2) { return v1 !== v2; });
    case 'ident':
      var val = lookup(env, expr.name);
      if(val === null) {
        throw "Variable " + expr.name + " not found.";
      }
      return val;
    case 'call':
      var f = lookup(env, expr.name);
      var args = [];
      for(var i = 0; i < expr.args.length; i++) {
        args.push(evalExpr(expr.args[i], env));
      }
      return f.apply(this, args);
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

var numberOp = function(expr, env, op) {
  var v1 = evalExpr(expr.left, env);
  var v2 = evalExpr(expr.right, env);
  if(typeof v1 !== 'number' || typeof v2 !== 'number') {
    throw "Arguments to " + expr.tag + " must be numbers";
  } 
  return op(v1, v2);
} 

var evalIf = function(statement, env) {
  var cond = evalExpr(statement.expr, env);
  if(typeof cond !== 'boolean') {
    throw "Conditions for if must be boolean";
  }
  if(cond) {
    return evalStatements(statement.body, env);
  }
};

var evalRepeat = function(statement, env) {
  var val;
  var num = evalExpr(statement.expr, env);
  if(typeof num !== 'number') {
    throw "Repeat only accepts numbers";
  }
  if(num < 0) {
    throw "Repeat only accepts numbers >= 0";
  }
  for(; num > 0; num--) {
    val = evalStatements(statement.body, env);
  }
  return val;
};

var createFunction = function(statement, env) {
  return function() {
    if(statement.args.length !== arguments.length) {
      throw "Wrong number of arguments in call to " + statement.name + " expected " + statement.args.length + " received " + arguments.length;
    }
    var newenv = { bindings: {}, outer: env };
    for(var i = 0; i < statement.args.length; i++) {
      newenv.bindings[statement.args[i]] = arguments[i];
    }  
    return evalStatements(statement.body, newenv);
  };
};

var evalStatement = function(statement, env) {
  switch(statement.tag) {
    case 'ignore':
      return evalExpr(statement.body, env);
    case 'var':
      add_binding(env, statement.name, 0);
      return 0;
    case ':=':
      return update(env, statement.left, evalExpr(statement.right, env));
    case 'if':
      return evalIf(statement, env);
    case 'repeat':
      return evalRepeat(statement, env);
    case 'define':
      add_binding(env, statement.name, createFunction(statement, env));
  }
};

var evalStatements = function(statements, env) {
  var val = undefined;
  for(var i = 0; i < statements.length; i++) {
    val = evalStatement(statements[i], env);
  }
  return val;
};

var eval = evalStatements;

var evalString = function(expr, env) {
  return eval(parse(expr), env);
}

if(typeof module !== 'undefined') {
  module.exports.eval = eval;
  module.exports.evalString = evalString;
}
