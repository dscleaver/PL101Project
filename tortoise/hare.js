if(typeof module !== 'undefined') {
  var parse = require('./parser').parse;
}

var compileExpr = function (expr) {
    if (typeof expr === 'number') {
        return expr.toString();
    }
    switch(expr.tag) {
        case '+': case '*': case '-': case '/': case '<': case '<=': case '>': case '>=': case '==': case '!=':
            return '(' + compileExpr(expr.left) + ')' + expr.tag + '(' +
                         compileExpr(expr.right) + ')';
        case 'ident':
            return expr.name;
        case 'call':
            var compiledArgs = [];
            for(var i = 0; i < expr.args.length; i++) {
                compiledArgs.push(compileExpr(expr.args[i]));
            }
            return expr.name + '(' + compiledArgs.join(',') + ')'; // Do stuff here
        default:
            throw new Error('Unknown tag ' + expr.tag);
    }
};

var repeat = function (num, func) {
    var i;
    var res;
    for(i = 0; i < num; i++) {
        res = func();
    }
    return res;
};

var compileStatement = function (stmt) {
    // Statements always have tags
    switch(stmt.tag) {
        // A single expression
        case 'ignore':
            return '_res = (' + 
                compileExpr(stmt.body) + ');\n';
        case 'var':
          // Evaluates to 0
            return '_res = 0;\nvar ' + stmt.name + ';\n' + stmt.name + " = (" + compileExpr(stmt.initial) + ");";
        case ':=':
            return '_res = (' + stmt.left + ' = ' +
                                compileExpr(stmt.right) + ');\n';
        case 'repeat':
            return '_res = repeat(' + compileExpr(stmt.expr) + ',function() { ' + compileStatements(stmt.body, true) + '});';
        case 'if':
            return '_res = undefined;\n' + 
                   'if(' + compileExpr(stmt.expr) + ') {\n' +
                           compileStatements(stmt.body, false) + '}\n';
        case 'define':
            return '_res = 0;\nvar ' + stmt.name + ' = function(' +
                            stmt.args.join(',') + ') {' +
                            compileStatements(stmt.body, true) + '};\n';
        default:
            throw new Error('Unknown tag ' + stmt.tag);
    }
};

var compileStatements = function (stmts, is_funcbody) {
    var output = "var _res;";
    for(var i = 0; i < stmts.length; i++) {
        output += compileStatement(stmts[i]);
    }
    if(is_funcbody) {
        output += "return _res;";
    }
    return output;
};

var compileString = function(str) {
  return compileStatements(parse(str));
};

var compileEnvironment = function (env) {
    var output = "";
    if(env) {
      for(var key in env.bindings) {
        output += 'var ' + key + ' = ' + env.bindings[key].toString() + ';\n';
      }
    }
    return output;
};

var evalCompiled = function (prg, env) {
    if(env) {
        eval(compileEnvironment(env) + prg);
    } else {
      eval(prg);
    }
    return _res;
};

if(typeof module !== 'undefined') {
  module.exports.evalCompiled = evalCompiled;
  module.exports.compileStatements = compileStatements;
  module.exports.compileString = compileString;
}
