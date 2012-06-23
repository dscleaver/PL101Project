if(typeof module !== 'undefined') {
  var parse = require('./parser').parse;
  var continuations = require('./continuations.js');
  var thunk = continuations.thunk;
  var thunkValue = continuations.thunkValue;
}

var nameCounter = 1;
var Channel = function(name) {
  this.pendingSends = [];
  this.pendingReceives = [];
  this.isChannel = true;
  this.name = name + '_' + (nameCounter++);
};

Channel.prototype.send = function(value, next) {
      if(this.pendingReceives.length === 0) {
        this.pendingSends.push([ value, next ]);
        return [];
      } else {
        return [ thunk(this.pendingReceives.shift(), value), next ];
      }
    };

Channel.prototype.receive = function(receiver) {
      if(this.pendingSends.length === 0) {
        this.pendingReceives.push(receiver);
        return [];
      } else {
        var pendingSend = this.pendingSends.shift();
        if(pendingSend != null) {
          return [ pendingSend[1], thunk(receiver, pendingSend[0]) ];
        } else {
          return [ thunk(receiver, pendingSend[0]) ];
        }
      }
    };

Channel.prototype.toString = function() {
  return this.name;
};

var evalExpr = function(expr, env, cont) {
  if(typeof expr === 'boolean') {
    return [ thunk(cont, expr) ];
  }
  if(typeof expr === 'number') {
    return [ thunk(cont, expr) ];
  }
  if(typeof expr === 'string') {
    var val = lookup(env, expr);
    if(val === null) {
      throw "No binding for variable " + expr;
    }
    return [ thunk(cont, val) ];
  }
  if(expr.length === 0) {
    return [ thunk(cont, expr) ];
  }
  var i = 1; 
  var val_list = [];
  var evalTupleArgs = function(val) {
    val_list.push(val);
    if(i === expr.length) {
      return [ thunk(cont, val_list) ];
    }
    return [ thunk(evalExpr, expr[i++], env, evalTupleArgs) ];
  };
  return [ thunk(evalExpr, expr[0], env, evalTupleArgs) ]; 
};

var createBindings = function(pattern, value, env) {
  if(typeof pattern === 'string') {
    env.bindings[pattern] = value;
  } else if(pattern instanceof Array && value instanceof Array && pattern.length === value.length) {
    for(var i = 0; i < pattern.length; i++) {
      createBindings(pattern[i], value[i], env);
    } 
  } else {
    throw "Unmatched pattern: could not match " + pattern + " to " + value;
  } 
};

var evalProcess = function(expr, env) {
  var replicated = false;
  switch(expr.tag) {
    case '!':
      return [ thunk(evalExpr, expr.channel, env, function(chan) {
        return [ thunk(evalExpr, expr.value, env, function(val) {
          return chan.send(val, thunk(evalProcess, expr.next, env));
        }) ];
      }) ];
    case '?':
      return [ thunk(evalExpr, expr.channel, env, function(chan) {
        return chan.receive(function(val) {
          var newEnv = { bindings: { }, outer: env };
          createBindings(expr.value, val, newEnv);
          return [ thunk(evalProcess, expr.next, newEnv) ];
        });
      }) ];
    case '?*':
      return [ thunk(evalExpr, expr.channel, env, function(chan) {
        return chan.receive(function(val) {
          var newEnv = { bindings: { }, outer: env };
          createBindings(expr.value, val, newEnv); 
          return [ thunk(evalProcess, expr.next, newEnv), thunk(evalProcess, expr, env) ]
        });
      }) ];
    case 'new':
      var newEnv = { bindings: { }, outer: env };
      newEnv.bindings[expr.channel] = new Channel(expr.channel);
      return [ thunk(evalProcess, expr.next, newEnv) ];
    case '|':
      return [ thunk(evalProcess, expr.left, env), thunk(evalProcess, expr.right, env) ]; 
    case 'nil':
      return [];
    case 'run':
      return [ thunk(evalProcess, expr.process, env), thunk(evalProcess, expr.next, env) ];
    case 'def':
      var newEnv = { bindings: { }, outer: env };
      var processes = [ thunk(evalProcess, expr.next, newEnv) ];
      for(var i = 0; i < expr.channels.length; i++) {
        newEnv.bindings[expr.channels[i]] = new Channel(expr.channel);
        processes.push(thunk(evalProcess, expr.processes[i], newEnv));
      }
      return processes;
    case 'if':
      return [ thunk(evalExpr, expr.condition, env, function(val) {
        var next = expr.whenFalse;
        if(typeof val !== 'boolean') {
          throw "Conditional value for if must be a boolean";
        }
        if(val) {
          next = expr.whenTrue;
        }
        return [ thunk(evalProcess, next, env) ];
      }) ];
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

var createGlobalEnv = function() {
  var env = { bindings: {}, outer: null };

  var bindBinaryOp = function(name, func) {
    env.bindings[name] = {
      send: function(value, next) {
        if(!Array.isArray(value) || value.length !== 3) {
          throw "Value send to " + name + " must be a tuple containing three values.";
        }
        if(typeof value[2].send === 'undefined') {
          throw "Third value sent to " + name + " must be a Writeable Channel.";
        } 
        return [ next ].concat( value[2].send(func(value[0], value[1]), null) );
      }
    };
  };

  var bindNumericOp = function(name, func) {
    bindBinaryOp(name, function(v1, v2) {
      if(typeof v1 !== 'number' || typeof v2 !== 'number') {
        throw "The first and second arguments to " + name + " must be numbers.";
      }
      return func(v1, v2);
    });
  };

  bindNumericOp('+', function(x, y) { return x + y; });
  bindNumericOp('-', function(x, y) { return x - y; });
  bindNumericOp('*', function(x, y) { return x * y; });
  bindNumericOp('/', function(x, y) { return x / y; });
  bindNumericOp('%', function(x, y) { return x % y; });
  bindNumericOp('<', function(x, y) { return x < y; });
  bindNumericOp('>', function(x, y) { return x > y; });
  bindNumericOp('<=', function(x, y) { return x <= y; });
  bindNumericOp('>=', function(x, y) { return x >= y; });

  bindBinaryOp('==', deepEqual);
  bindBinaryOp('/=', function(x, y) { return !deepEqual(x, y); });

  return env;
};

var deepEqual = function(x, y) {
  if( x === y ) {
    return true;
  }
  if(Array.isArray(x) && Array.isArray(y) && x.length === y.length) {
    for(var i = 0; i < x.length; i++) {
      if(!deepEqual(x[i], y[i])) {
        return false;
      }
    }
    return true;
  }
  return false;
};

var stepStart = function(expr, env) {
  var startEnv = env || { bindings: {}, outer: createGlobalEnv() };
  return {
    data: [ thunk(evalProcess, expr, startEnv) ],
    done: false
  };
};

var step = function(state) {
  if(state.done) {
    return;
  }
  var thunk = state.data.shift();
  var next = thunk.func.apply(null, thunk.args);
  state.data = state.data.concat(next);
  if(state.data.length === 0) {
    state.done = true;
  } 
};

var eval = function(expr, env, startState) {
  var state = startState || stepStart(expr, env);
  while(!state.done) {
    step(state);
  }
  return state.data;
};

var evalString = function(expr, env) {
  return eval(parse(expr), env);
}

if(typeof module !== 'undefined') {
  module.exports.step = step;
  module.exports.eval = eval;
  module.exports.evalString = evalString;
  module.exports.createGlobalEnv = createGlobalEnv;
}
