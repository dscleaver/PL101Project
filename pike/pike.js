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
        return [ pendingSend[1], thunk(receiver, pendingSend[0]) ];
      }
    };

Channel.prototype.toString = function() {
  return this.name;
};

var evalExpr = function(expr, env, cont) {
  if(typeof expr === 'string') {
    return [ thunk(cont, lookup(env, expr)) ];
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
          newEnv.bindings[expr.value] = val;
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

var stepStart = function(expr, env) {
  return {
    data: [ thunk(evalProcess, expr, env) ],
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
}
