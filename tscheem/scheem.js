if(typeof module !== 'undefined') {
  var parse = require('./parser');
  var parser = parse.parser;
  var parseScheem = parse.parseScheem;
}

var type = function(str) {
  return parser.parse(str, "type");
} 

var sameType = function (a, b) {
    if(a.tag !== b.tag) {
        return false;
    }
    switch(a.tag) {
        case 'basetype': 
            return a.name === b.name;
        case 'arrowtype':
            return sameType(a.left, b.left) && sameType(a.right, b.right);
        case 'abstype':
            return a.name === b.name;
        case 'listtype':
            if(a.type && b.type) {
              return sameType(a.type, b.type);
            }
            return true;
    }
};

var typeExprIf = function (expr, context) {
    var COND_type = typeExpr(expr[1], context);
    var A_type = typeExpr(expr[2], context);
    var B_type = typeExpr(expr[3], context);
    if(COND_type.name !== 'bool') {
        throw "Not a bool type";
    }
    if(!sameType(A_type, B_type)) {
        throw "Not same type";
    }
    return A_type;
};

var typeExprLambda = function(expr, context) {
    var args = expr[1];
    var body = expr[2];
    var newContext = { bindings: {}, outer: context };
    var arrowptr = { tag: 'arrowtype' };
    var last = arrowptr;
    for (var i = args.length - 1; i >= 0; i--) {
      var arg = null;
      var arg_type = null;
      if(typeof args[i] === 'string') {
        throw "Lambda arguments must be typed";
      } else {
        arg = args[i].expr;
        arg_type = args[i].type;
      }
      newContext.bindings[arg] = arg_type;
      arrowptr.left = arg_type;
      arrowptr = { tag: 'arrowtype', right: arrowptr }
    }
    var arrow = arrowptr.right;
    if(typeof arrow === 'undefined') {
      arrow = { tag: 'arrowtype', left: 'unittype' };
      last = arrow;
    }
    addDefines(getDefineExprsInContext(body), newContext);
    last.right = typeExpr(body, newContext);
    return arrow;
};

var isAbstract = function(type) {
  switch(type.tag) {
    case 'basetype': return false;
    case 'unittype': return false;
    case 'listtype': return isAbstract(type.type);
    case 'arrowtype': return isAbstract(type.left) || isAbstract(type.right);
    case 'abstype': return true;
  }
};

var bindType = function(from, to, bindings) {
  if(to.tag === 'abstype') {
    var bound = bindings[to.name];
    if(typeof bound === 'undefined') {
      bindings[to.name] = from;
      return true;
    }
    return sameType(bindings[to.name], from);
  }
  if(from.tag !== to.tag) {
    return false;
  }
  switch(from.tag) {
    case 'basetype': return true;
    case 'unittype': return true;
    case 'listtype': return bindType(from.type, to.type, bindings);
    case 'arrowtype': return bindType(from.left, to.left, bindings) && bindType(from.right, to.right, bindings);
  }
}; 

var replaceBindings = function(to, bindings) {
  switch(to.tag) {
    case 'abstype':
      var bound = bindings[to.name];
      if(typeof bound === 'undefined') {
        return to;
      }
      return bound;
    case 'basetype': return to;
    case 'unittype': return to;
    case 'listtype': return { tag: 'listtype', type: replaceBindings(to.type, bindings) };
    case 'arrowtype': return { tag: 'arrowtype', left: replaceBindings(to.left, bindings), right: replaceBindings(to.right, bindings) }

  }
};
  

var typeExprBegin = function(expr, context) {
  var outType = { tag: 'unittype' };
  for(var i = 1; i < expr.length; i++) {
    outType = typeExpr(expr[i], context);
  }
  return outType;
};

var typeApplication = function(expr, context) {
    // Application (A B C)
    var A = expr[0];
    var A_type = typeExpr(A, context);
    if(expr.length === 1) {
      if(A_type.tag !== 'arrowtype') {
        throw "Not an arrow type";
      }
      if(A_type.left.tag !== 'unittype') {
        throw "Function requires " + A_type.left.tag;
      }
      return A_type.right;
    }
    var bindings = {};
    for(var i = 1; i < expr.length; i++) {
      if (A_type.tag !== 'arrowtype') {
        throw "Not an arrow type";
      }
      var B = expr[i];
      var B_type = typeExpr(B, context);
    // Check that A type is arrow type
      var U_type = A_type.left;
      if(isAbstract(U_type)) {
        if(bindType(B_type, U_type, bindings) === false) {
          throw "Can not match argument type";
        }
      } else {
    // Verify argument type matches
        if (sameType(U_type, B_type) === false) {
          throw "Argument type did not match";
        }
      }
      A_type = A_type.right;
    }
    return replaceBindings(A_type, bindings);
};

var typeExprQuote = function(expr) {
  if(expr === '#t' || expr === '#f') {
    return { tag: 'basetype', name: 'bool' };
  }
  if(typeof expr === 'string') {
    return { tag: 'basetype', name: 'sym' };
  }
  if(typeof expr === 'number') {
    return { tag: 'basetype', name: 'num' };
  }
  if(!Array.isArray(expr)) {
    throw "Can not quote type expressions";
  }
  if(expr.length === 0) {
    return { tag: 'listtype', type: false };
  }
  var listType = typeExprQuote(expr[0]);
  for(var i = 1; i < expr.length; i++) {
    if(sameType(listType, typeExprQuote(expr[i])) === false) {
      throw "Lists must all contain the same type.";
    }
  }
  return { tag: 'listtype', type: listType };
};
  
var formatType = function(type) {
  return "type";
}

var getDefineExprsInContext = function(expr) {
  if(typeof expr === 'number') {
    return [];
  }
  if(typeof expr === 'string') {
    return [];
  }
  if(!Array.isArray(expr)) {
    return getDefineExprsInContext(expr.expr);
  }
  if(expr[0] === 'lambda') {
    return [];
  }
  if(expr[0] === 'define') {
    return [ expr ];
  }  
  var defines = [];
  for(var i = 0; i < expr.length; i++) {
    defines = defines.concat(getDefineExprsInContext(expr[i]));
  }
  return defines;
};

var addDefine = function(define, context) {
  var name = define[1];
  var typeHint = null;
  if(name.tag === 'typeexpr') {
    typeHint = name.type;
    name = name.expr;
  }
  if(typeof name !== 'string') {
    throw "The first argument to define must be a variable but was " + JSON.stringify(expr[1]);
  }
  if(lookup(context, name) !== null) {
    throw expr[1] + " is already defined.";
  }
  context.bindings[name] = { tag: 'unprocessed', processing: false, name: name, expr: define[2], typeHint: typeHint}
};
 
var processDefine = function(unprocessed, context) {
  if(unprocessed.processing) {
    throw "Circular definitions without type hints are not allowed";
  }
  unprocessed.processing = true;
  var exprType = typeExpr(unprocessed.expr, context);
  if(unprocessed.typeHint !== null && sameType(exprType, unprocessed.typeHint) === false) {
    throw "Definition of " + unprocessed.name + " with type " + formatType(unprocessed.typeHint) + " doew not match " + formatType(unprocessed.typeHint);
  }
  update(context, unprocessed.name, exprType);
  return exprType; 
}; 
    
var addDefines = function(defines, context) {
  for(var i = 0; i < defines.length; i++) {
    addDefine(defines[i], context);
  }
};

var makeEmptyTypeContext = function() {
  return { bindings: {}, outer: globalTypeEnv };
}

var typeExpr = function (expr, context) {
    if(!context) {
      context = makeEmptyTypeContext();
      addDefines(getDefineExprsInContext(expr), context);
    }
    if (typeof expr === 'number') {
        return { tag: 'basetype', name: 'num' };
    }
    if (expr === '#t' || expr === '#f') {
      return { tag: 'basetype', name: 'bool' };
    }
    if (typeof expr === 'string') {
        var type = lookup(context, expr);
        if(type === null) {
          throw "Type error: no type for " + expr;
        }
        if(type.tag === 'unprocessed') {
          if(type.typeHint !== null) {
            type = type.typeHint;
          } else {
            type = processDefine(type, context);
          }
        }
        return type;
    }
    if(!Array.isArray(expr)) {
      var actualType = typeExpr(expr.expr, context);
      if(!sameType(actualType, expr.type)) {
        throw "Type error: " + formatType(actualType) + " does not match " + formatType(expr.type);
      }
      return expr.type;
    }    
    if (expr[0] === 'if') {
        return typeExprIf(expr, context);
    }
    if(expr[0] === 'lambda') {
      return typeExprLambda(expr, context);
    }
    if(expr[0] === 'begin') {
      return typeExprBegin(expr, context);
    }
    if(expr[0] === 'quote') {
      return typeExprQuote(expr[1]);
    }
    if(expr[0] === 'set!') {
      var type = lookup(expr[1], context);
      var valueType = typeExpr(expr[2], context);
      if(sameType(type, valueType) === false) {
        throw "Can not set " + expr[1] + " of type " + formatType(type) + " to " + formatType(valueType);
      }
      return { tag: 'unittype' };
    }
    if(expr[0] === 'define') {
      var name = expr[1];
      if(name.tag === 'typeexpr') {
        name = name.expr;
      }
      var type = lookup(context, name);
      if(type.tag === 'unprocessed') {
        processDefine(type, context);
      }
      return { tag: 'unittype' };
    }
    return typeApplication(expr, context);
};

var eraseTypes = function(expr) {
  if(typeof expr === 'number') {
    return expr;
  }
  if(typeof expr === 'string') {
    return expr;
  }
  if(expr.tag === 'typeexpr') {
    return eraseTypes(expr.expr);
  }
  var newExpr = [];
  for(var i = 0; i < expr.length; i++) {
    newExpr.push(eraseTypes(expr[i]));
  }
  return newExpr;
};  

var prettyPrint = function(value) {
  if(typeof value === 'string') {
    return value;
  }
  if(typeof value === 'number') {
    return value;
  }
  if(typeof value === 'function') {
    return value.meta.displayString();
  }
  var values = [];
  for(var i in value) {
    values.push(prettyPrint(value[i]));
  }
  return "(" + values.join(" ") + ")";
}; 

var globalTypeEnv = { bindings: {}, outer:null, isLocked: true };
var globalEnv = { bindings: {}, outer: null, isLocked: true };

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
      throw "Variable " + v + " is not defined";
    }
    var bound = env.bindings[v];
    if(typeof bound !== 'undefined') {
      if(env.isLocked) {
        throw "Can not change built in value " + v;
      }
      env.bindings[v] = val;
    } else {
      update(env.outer, v, val);
    }
};

var add_binding = function (env, v, val) {
    env.bindings[v] = val;
};

var scheemSpecialForms = {};

var emptyEnv = function() {
  return { bindings: {}, outer: globalEnv };
}

var evalScheem = function (expr, env) {
    env = env || { bindings: {}, outer: emptyEnv() };
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
    if(expr.length === 1) {
      return funct();
    }
    for(var i = 1; i < expr.length; i++) {
      if(typeof funct !== 'function') {
        throw "Unable to apply " + prettyPrint(expr);
      }
      funct = funct(evalScheem(expr[i], env));
    }
    
    return funct;    
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

var checkAllString = function(args) {
  for(var i = 0; i < args.length; i++) {
    if(typeof args[i] !== 'string') {
      throw "Arguments to functions must be symbols";
    }
  }
};

addSpecialForm('lambda', function(expr, env) {
  var args = expr[1];
  if(!Array.isArray(args)) {
    throw "The first argument to lambda must be a list of arguments";
  }
  checkAllString(args);
  var body = expr[2];
  var initialMeta = { name: "function",
               argString: function(nextString) {
                 return nextString;
               }, 
               displayString: function() {
                 return "[" + this.name + ": " + prettyPrint(expr) + "]";
               }
             };
  if(args.length == 0) {
    var zeroFunc = function() {
      return evalScheem(body, { bindings: {}, outer: env });
    };
    zeroFunc.meta = initialMeta;
    return zeroFunc;
  }
  var next = function(i, functionEnv, meta) {
    if(i === args.length) {
      return evalScheem(body, functionEnv);
    }
    var nextFunc = function(v) {
      if(typeof v === undefined) {
        throw "Can not call " + nextFunc.meta.displayString() + " with zero args."
      }
      var nextEnv = { bindings: {}, outer: functionEnv };
      functionEnv.bindings[args[i]] = v;
      var nextMeta = { name: "function",
                       argString: function(nextString) {
                         return meta.argString(prettyPrint(v) + " " + nextString);
                       }, 
                       displayString: function() {
                         return "[" + this.name + ": (" + prettyPrint(expr) + this.argString("") + ")]";
                       }
                     };
      return next(i + 1, nextEnv, nextMeta);
    };
    nextFunc.meta = meta;
    return nextFunc;
  };
  return next(0, env, initialMeta);
}, 2);

var argLengthWrapper = function(name, func, argLength) {
  return function() {
    if(arguments.length !== argLength) {
      throw "Wrong number of arguments to " + name + " expected " + argLength + " and received " + arguments.length;
    }
    return func.apply(this, arguments);
  };
}
    
var define = function(name, func, typeString) {
  var wrapped = func;
  wrapped.meta = { name: name,
                   displayString: function() {
                     return "[" + this.name + ": built in]";
                   }
                 };
  globalTypeEnv.bindings[name] = type(typeString); 
  globalEnv.bindings[name] = wrapped;
}

globalEnv.bindings['#t'] = '#t';
globalEnv.bindings['#f'] = '#f';

var addNumberOp = function(name, op) {
  define(name, function(v1) {
    if(typeof v1 === 'undefined') {
      throw "Can not call " + name + " with zero args.";
    }
    return function(v2) {
      if(typeof v1 !== 'number' || typeof v2 !== 'number') {
        throw "Arguments to " + name + " must be numbers, given " + JSON.stringify(v1) + " and " + JSON.stringify(v2);;
      }
      return op(v1, v2);
    };
  }, "Num->Num->Num");
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

define('=', function(v1) {
    if(typeof v1 === 'undefined') {
      throw "Can not call " + name + " with zero args.";
    }
  return function(v2) {
    if(deepEqual(v1, v2)) return '#t';
    return '#f';
  };
}, "a->a->Bool");

var addNumComparisonOp = function(name, op) {
  define(name, function(v1) {
    if(typeof v1 === 'undefined') {
      throw "Can not call " + name + " with zero args.";
    }
    return function(v2) {
      if(typeof v1 !== 'number' || typeof v2 !== 'number') {
        throw "Arguments to " + name + " must be numbers, given " + JSON.stringify(v1) + " and " + JSON.stringify(v2);
      }
      if(op(v1, v2)) return '#t';
      return '#f';
    };
  }, "Num->Num->Bool");
};  

addNumComparisonOp('<', function(v1, v2) { return v1 < v2; });
addNumComparisonOp('>', function(v1, v2) { return v1 > v2; });
addNumComparisonOp('<=', function(v1, v2) { return v1 <= v2; });
addNumComparisonOp('>=', function(v1, v2) { return v1 >= v2; });

define('cons', function(element) {
    if(typeof element === 'undefined') {
      throw "Can not call " + name + " with zero args.";
    }
  return function(list) {
    if(!(list instanceof Array)) {
      throw "The second argument to cons must be a list was " + JSON.stringify(list);
    }
    return [ element ].concat(list);
  };
}, "a->[a]->[a]");

define('car', function(list) {
  if(!(list instanceof Array)) {
    throw "The argument to car must be a list was " + JSON.stringify(list);
  }
  if(list.length === 0) {
    throw "Can not call car on an empty list";
  }
  return list[0];
}, "[a]->a");

define('cdr', function(list) {
  if(!(list instanceof Array)) {
    throw "The argument to cdr must be a list was " + JSON.stringify(list);
  }
  if(list.length === 0) {
    throw "Can not call cdr on an empty list";
  }
  return list.slice(1);
}, "[a]->[a]");

define('alert', function(v) {
    if(typeof v === 'undefined') {
      throw "Can not call " + name + " with zero args.";
    }
  var toShow = prettyPrint(v);
  if(typeof module !== 'undefined') {
    console.log(toShow);
  } else {
    window.alert(toShow);
  }
  return 0;
}, "a->num");

if(typeof module !== 'undefined') {
  module.exports.evalScheem = evalScheem;
  module.exports.evalScheemString = evalScheemString;
  module.exports.lookup = lookup;
  module.exports.globalEnv = null;
  module.exports.typeExpr = typeExpr;
  module.exports.eraseTypes = eraseTypes;
  module.exports.emptyEnv = emptyEnv;
}
