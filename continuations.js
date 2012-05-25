var thunk = function (f, lst) {
    return { tag: "thunk", func: f, args: lst };
};

var thunkValue = function (x) {
    return { tag: "value", val: x };
};

var trampoline = function (thk) {
    while (true) {
        if (thk.tag === "value") {
            return thk.val;
        }
        if (thk.tag === "thunk") {
            thk = thk.func.apply(null, thk.args);
        }
    }
};

var makeTree = function(depth) {
  var tree = null;
  for(var i = depth; i > 0; i--) {
     tree = { data: depth, left: tree, right: tree };
  }
  return tree; 
};

var count = function(btree) {
  if(btree === null) return 0;
  return 1 + count(btree.left) + count(btree.right);
};

var countCPS = function(btree, cont) {
  if(btree === null)
    return cont(0);
  var first_cont = function(leftCount) {
    var second_cont = function(rightCount) {
      return cont(1 + leftCount + rightCount);
    };
    return countCPS(btree.right, second_cont);
  };
  return countCPS(btree.left, first_cont);
};

var countThunk = function(btree, cont) {
  if(btree === null) return thunk(cont, [0]);
  var first_cont = function(leftCount) {
    var second_cont = function(rightCount) {
      return thunk(cont, [1+leftCount+rightCount]);
    };
    return thunk(countThunk, [btree.right, second_cont]);
  }; 
  return thunk(countThunk, [btree.left, first_cont]);
};

var runCountThunk = function(btree) {
  return trampoline(countThunk(btree, thunkValue));
};

module.exports.count = count;
module.exports.countCPS = countCPS;
module.exports.countThunk = runCountThunk;


module.exports.small = { data: 'c', left: { data: 'b', left: { data: 'a', left: null, right: null }, right: null }, right: { data: 'd', left: null, right: null}};
module.exports.makeTree = makeTree;
