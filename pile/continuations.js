var thunk = function(f) {
  var args = Array.prototype.slice.call(arguments);
  args.shift();
  return { tag: "thunk", func: f, args: args };
}

var thunkValue = function(x) {
  return { tag: "value", val: x };
}

if(typeof module !== 'undefined') {
  module.exports.thunk = thunk;
  module.exports.thunkValue = thunkValue; 
}
