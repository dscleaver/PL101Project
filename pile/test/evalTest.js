if(typeof module !== 'undefined') {
  var chai = require('chai');
  var pile = require('../pile');
  var thunk = require('../continuations').thunk;
  var eval = pile.eval;
  var evalString = pile.evalString;
  var createGlobalEnv = pile.createGlobalEnv;
} 
var assert = chai.assert;

var makeSensor = function() {
  return {
        values: [],
        send: function(value, next) {
          this.values.push(value);
          return this.respondWith( next );
        },
        respondWith: function(next) {
          if(next != null) {
            return [next];
          } else {
            return [];
          }
        }
      };
};

var makeInjector = function() {
  return {
        nextValue: 0,
        receive: function(receiver) {
          return this.respondWith( receiver, this.value(this.nextValue++) );
        },
        respondWith: function(receiver, value) {
          return [ thunk(receiver, value) ];
        },
        value: function(i) {
          return i;
        }
      };
};

suite('Eval Tests', function() {
  var sensor;
  var injector;
  var env;

  setup(function() {
    sensor = makeSensor();
    injector = makeInjector();
    env = { bindings: { x: sensor, z: injector, y: 2 }, outer: createGlobalEnv() };
  });

  suite('Nil process', function() {
    test('Does nothing', function() {
      evalString(" run ()");
    });
  });
  suite('Send', function() {
    test('send sends the value to the channel', function() {
      evalString("run x!y.()", env);
      assert.deepEqual(sensor.values, [ 2 ]);
    });
    test('evaluation continues after send is received', function() {
      evalString("run x!y.x!y.()", env);
      assert.deepEqual(sensor.values, [ 2, 2 ]);
    });
    test('evaluation only proceeds when channel allows', function() {
      sensor.respondWith = function(next) { return []; };
      evalString("run x!y.x!y.()", env);
      assert.deepEqual(sensor.values, [ 2 ]);
    });
    test('can send empty tuple', function() {
      evalString("run x![].()", env);
      assert.deepEqual(sensor.values, [ [] ]);
    });
    test('can send one value tuple', function() {
      evalString("run x![y].()", env);
      assert.deepEqual(sensor.values, [ [ 2 ] ]);
    });
    test('can send multiple value tuple', function() {
      evalString("run x![y [] y].()", env);
      assert.deepEqual(sensor.values, [ [ 2, [], 2 ] ]);
    });
    test('can send boolean values', function() {
      evalString("run x!true.x!false", env);
      assert.deepEqual(sensor.values, [ true, false ]);
    });
    test('can send number values', function() {
      evalString("run x!23.x!258", env);
      assert.deepEqual(sensor.values, [ 23, 258 ]);
    });
  });
  suite('Receive', function() {
    test('Receive calls receive on channel with function to accept value', function() {
      evalString("run z?y = ()", env);
      assert.deepEqual(injector.nextValue, 1);
    });      
    test('Receive binds variable in local environment and makes it available in the rest of the process', function() {
      evalString("run z?t = x!t.()", env);
      assert.isUndefined(env.bindings.t);
      assert.deepEqual(sensor.values, [ 0 ]);
    });
    test('Receive shadows variables bound in outer environment', function() {
      evalString("run z?y = x!y.()", env);
      assert.deepEqual(2, env.bindings.y);
      assert.deepEqual(sensor.values, [ 0 ]);
    });
    test('empty tuple matches empty tuple', function() {
      injector.value = function(i) {
        return [];
      };
      evalString("run z?[] = x!y.()", env);
      assert.deepEqual(sensor.values, [ 2 ]);
    });
    test('empty tuple does not match other values', function() {
      assert.throws(function() {
        evalString("run z?[] = x!y.()", env);
      });
      assert.throws(function() {
        injector.value = function(i) {
          return [ i ];
        };
        evalString("run z?[] = x!y.()", env);
      }); 
    });
    test('tuple pattern binds variables in pattern', function() {
      injector.value = function(i) {
        return [i, i + 1];
      };
      evalString("run z?[a b] = x![b a].()", env);
      assert.deepEqual(sensor.values, [ [1, 0] ]);
    });
    test('tuple pattern will not match other values', function() {
      assert.throws(function() {
        evalString("run z?[a b] = x![b a].()", env);
      });
      assert.throws(function() {
        injector.value = function(i) {
          return [ i, i + 1 ];
        };
        evalString("run z?[a] = x!a.()", env);
      });
      assert.throws(function() {
        injector.value = function(i) {
          return [ i ];
        };
        evalString("run z?[a b] = x!a.()", env);
      });
    });
    test('evaluation only proceeds when channel allows', function() {
      injector.respondWith = function() { return []; };
      evalString("run z?y = x!y.()", env);
      assert.deepEqual(sensor.values, []);
    });
  });
  suite('Replicated Receive', function() {
    setup(function() {
      var i = 0;
      injector.respondWith = function(receiver, value) {
        if(i++ < 3) {
          return [ thunk(receiver, value) ];
        } else {
          return [];
        }
      };
    });
    test('replicates itself after receive', function () {
      evalString("run z?*y = x!y.()", env);
      assert.deepEqual(sensor.values, [0, 1, 2]);
    });
    test('empty tuple matches empty tuple', function() {
      injector.value = function(i) {
        return [];
      };
      evalString("run z?*[] = x!y.()", env);
      assert.deepEqual(sensor.values, [ 2, 2, 2 ]);
    });
    test('empty tuple does not match other values', function() {
      assert.throws(function() {
        evalString("run z?*[] = x!y.()", env);
      });
      assert.throws(function() {
        injector.value = function(i) {
          return [ i ];
        };
        evalString("run z?*[] = x!y.()", env);
      }); 
    });
    test('tuple pattern binds variables in pattern', function() {
      injector.value = function(i) {
        return [i, i + 1];
      };
      evalString("run z?*[a b] = x![b a].()", env);
      assert.deepEqual(sensor.values, [ [1, 0], [2, 1], [3, 2] ]);
    });
    test('tuple pattern will not match other values', function() {
      assert.throws(function() {
        evalString("run z?*[a b] = x![b a].()", env);
      });
      assert.throws(function() {
        injector.value = function(i) {
          return [ i, i + 1 ];
        };
        evalString("run z?*[a] = x!a.()", env);
      });
      assert.throws(function() {
        injector.value = function(i) {
          return [ i ];
        };
        evalString("run z?*[a b] = x!a.()", env);
      });
    });
  });
  suite('Parallel', function() {
    test('Runs all processes', function() {
      evalString("run (z?t = x!t|x!y)", env);
      assert.deepEqual(sensor.values, [2, 0]);
    });
  });
  suite('New', function() {
    test('creates a channel and binds it to the name for the process', function() {
      evalString(" new n\nrun x!n.()", env);
      assert.deepEqual(sensor.values[0].isChannel, true);
    });
    var assertReceiveValues = function(channel, expectedProcess, expectedValue) {
      var func = function() {};
      var thunks = channel.receive(func);
      assert.deepEqual(thunks[0].args[0], expectedProcess);
      assert.deepEqual(thunks[1], { tag: 'thunk', func: func, args: [ expectedValue ] });
    };
    test('created channel buffers sends until a receive occurs', function() {
      evalString(" run (new t (z?n = t!n.z?g = ()|z?n = t!n.()|x!t.()))", env);
      var t = sensor.values[0];
      assertReceiveValues(t, { tag: '?', channel: 'z', value: 'g', next: { tag: 'nil' }}, 0);
      assertReceiveValues(t, { tag: 'nil' }, 1);
    });
    var assertSendValues = function(channel, expectedProcess) {
      var th = thunk(function() {});
      var thunks = channel.send(5, th);
      assert.deepEqual(thunks[0].func.apply(null, thunks[0].args)[0].args[0], expectedProcess);
      assert.deepEqual(thunks[1], th);
    }; 
    test('created channel buffers receives until a send occurs', function() {
      evalString(" new t run (t?g = g!y.()|t?g = ()|x!t.())", env);
      var t = sensor.values[0];
      assertSendValues(t, { tag: '!', channel: 'g', value: 'y', next: { tag: 'nil' }}); 
    });
  });
  suite('Def', function() {
    test('def creates a persistent process', function() {
      evalString(" def p[r t] = t!r run (z?v = p![v x] | p![y x])", env);
      assert.deepEqual(sensor.values, [ 2, 0 ]); 
    });
    test('recursive def processes can call one another', function() {
      evalString(" def p[b t] = if b then t!true else q![t] and q[t] = p![false t] run p![true x]", env);
      assert.deepEqual(sensor.values, [true]);
    });
  });
  suite('If then else', function() {
    test('when conditional value is true, evaluate first process', function() {
      evalString("run if true then x!y else z?v = x!v", env);
      assert.deepEqual(sensor.values, [2]);
    });
    test('when conditional value is false, evaluate second process', function() {
      evalString("run if false then x!y else z?v = x!v", env);
      assert.deepEqual(sensor.values, [0]);
    });
    test('conditional must be boolean value', function() {
      assert.throws(function() {
        evalString("run z?v = if v then x!y else x!y", env);
      });
    });

  });
  suite('Plus', function() {
    test('works with proper inputs', function() {
      evalString("run +![1 2 x]", env);
      assert.deepEqual(sensor.values, [3]);
    });
    test('fails if first two arguments are not numbers', function() {
      assert.throws(function() {
        evalString("run +![1 true x]", env);
      });
    }); 
    test('fails if the third argument is not a writeable channel', function() {
      assert.throws(function() {
        evalString("run +![1 2 z]", env);
      });
    });
    test('fails if the value sent is not a tuple of length 3', function() {
      assert.throws(function() {
        evalString("run +!2", env);
      });
      assert.throws(function() {
        evalString("run +![]", env);
      });
    });
  });
  suite('Minus', function() {
    test('works with proper inputs', function() {
      evalString("run -![2 1 x]", env);
      assert.deepEqual(sensor.values, [1]);
    });
    test('fails if first two arguments are not numbers', function() {
      assert.throws(function() {
        evalString("run -![1 true x]", env);
      });
    }); 
    test('fails if the third argument is not a writeable channel', function() {
      assert.throws(function() {
        evalString("run -![1 2 z]", env);
      });
    });
    test('fails if the value sent is not a tuple of length 3', function() {
      assert.throws(function() {
        evalString("run -!2", env);
      });
      assert.throws(function() {
        evalString("run -![]", env);
      });
    });
  });
  suite('Times', function() {
    test('works with proper inputs', function() {
      evalString("run *![2 1 x]", env);
      assert.deepEqual(sensor.values, [2]);
    });
    test('fails if first two arguments are not numbers', function() {
      assert.throws(function() {
        evalString("run *![1 true x]", env);
      });
    }); 
    test('fails if the third argument is not a writeable channel', function() {
      assert.throws(function() {
        evalString("run *![1 2 z]", env);
      });
    });
    test('fails if the value sent is not a tuple of length 3', function() {
      assert.throws(function() {
        evalString("run *!2", env);
      });
      assert.throws(function() {
        evalString("run *![]", env);
      });
    });
  });
  suite('Divide', function() {
    test('works with proper inputs', function() {
      evalString("run /![4 2 x]", env);
      assert.deepEqual(sensor.values, [2]);
    });
    test('fails if first two arguments are not numbers', function() {
      assert.throws(function() {
        evalString("run /![1 true x]", env);
      });
    }); 
    test('fails if the third argument is not a writeable channel', function() {
      assert.throws(function() {
        evalString("run /![1 2 z]", env);
      });
    });
    test('fails if the value sent is not a tuple of length 3', function() {
      assert.throws(function() {
        evalString("run /!2", env);
      });
      assert.throws(function() {
        evalString("run /![]", env);
      });
    });
  });
  suite('Modulo', function() {
    test('works with proper inputs', function() {
      evalString("run %![4 2 x]", env);
      assert.deepEqual(sensor.values, [0]);
    });
    test('fails if first two arguments are not numbers', function() {
      assert.throws(function() {
        evalString("run %![1 true x]", env);
      });
    }); 
    test('fails if the third argument is not a writeable channel', function() {
      assert.throws(function() {
        evalString("run %![1 2 z]", env);
      });
    });
    test('fails if the value sent is not a tuple of length 3', function() {
      assert.throws(function() {
        evalString("run %!2", env);
      });
      assert.throws(function() {
        evalString("run %![]", env);
      });
    });
  });
  suite('less than', function() {
    test('works with proper inputs', function() {
      evalString("run <![2 4 x].<![4 2 x]", env);
      assert.deepEqual(sensor.values, [true, false]);
    });
    test('fails if first two arguments are not numbers', function() {
      assert.throws(function() {
        evalString("run <![1 true x]", env);
      });
    }); 
    test('fails if the third argument is not a writeable channel', function() {
      assert.throws(function() {
        evalString("run <![1 2 z]", env);
      });
    });
    test('fails if the value sent is not a tuple of length 3', function() {
      assert.throws(function() {
        evalString("run <!2", env);
      });
      assert.throws(function() {
        evalString("run <![]", env);
      });
    });
  });
  suite('greater than', function() {
    test('works with proper inputs', function() {
      evalString("run >![2 4 x].>![4 2 x]", env);
      assert.deepEqual(sensor.values, [false, true]);
    });
    test('fails if first two arguments are not numbers', function() {
      assert.throws(function() {
        evalString("run >![1 true x]", env);
      });
    }); 
    test('fails if the third argument is not a writeable channel', function() {
      assert.throws(function() {
        evalString("run >![1 2 z]", env);
      });
    });
    test('fails if the value sent is not a tuple of length 3', function() {
      assert.throws(function() {
        evalString("run >!2", env);
      });
      assert.throws(function() {
        evalString("run >![]", env);
      });
    });
  });
  suite('less than or equal to', function() {
    test('works with proper inputs', function() {
      evalString("run <=![2 4 x].<=![4 2 x].<=![3 3 x]", env);
      assert.deepEqual(sensor.values, [true, false, true]);
    });
    test('fails if first two arguments are not numbers', function() {
      assert.throws(function() {
        evalString("run <=![1 true x]", env);
      });
    }); 
    test('fails if the third argument is not a writeable channel', function() {
      assert.throws(function() {
        evalString("run <=![1 2 z]", env);
      });
    });
    test('fails if the value sent is not a tuple of length 3', function() {
      assert.throws(function() {
        evalString("run <=!2", env);
      });
      assert.throws(function() {
        evalString("run <=![]", env);
      });
    });
  });
  suite('greater than or equal to', function() {
    test('works with proper inputs', function() {
      evalString("run >=![2 4 x].>=![4 2 x].>=![3 3 x]", env);
      assert.deepEqual(sensor.values, [false, true, true]);
    });
    test('fails if first two arguments are not numbers', function() {
      assert.throws(function() {
        evalString("run >=![1 true x]", env);
      });
    }); 
    test('fails if the third argument is not a writeable channel', function() {
      assert.throws(function() {
        evalString("run >=![1 2 z]", env);
      });
    });
    test('fails if the value sent is not a tuple of length 3', function() {
      assert.throws(function() {
        evalString("run >=!2", env);
      });
      assert.throws(function() {
        evalString("run >=![]", env);
      });
    });
  });
  suite('equal to', function() {
    test('works with numbers', function() {
      evalString("run ==![2 4 x].==![4 4 x]", env);
      assert.deepEqual(sensor.values, [false, true]);
    });
    test('works with channels', function() {
      evalString("new r new t run ==![r r x].==![r t x]", env);
      assert.deepEqual(sensor.values, [true, false]);
    }); 
    test('works with tuples', function() {
      evalString("new r new t run ==![[r] [r] x].==![[r] [t] x]", env);
      assert.deepEqual(sensor.values, [true, false]);
    }); 
    test('works with complex tuples', function() {
      evalString("new r new t run ==![[r 1 [2 3]] [r 1 [2 3]] x].==![[4 1 [2 r]] [4 1 [2 t]] x]", env);
      assert.deepEqual(sensor.values, [true, false]);
    }); 
    test('fails if the third argument is not a writeable channel', function() {
      assert.throws(function() {
        evalString("run ==![1 2 z]", env);
      });
    });
    test('fails if the value sent is not a tuple of length 3', function() {
      assert.throws(function() {
        evalString("run ==!2", env);
      });
      assert.throws(function() {
        evalString("run ==![]", env);
      });
    });
  });
  suite('not equal to', function() {
    test('works with numbers', function() {
      evalString("run /=![2 4 x]./=![4 4 x]", env);
      assert.deepEqual(sensor.values, [true, false]);
    });
    test('works with channels', function() {
      evalString("new r new t run /=![r r x]./=![r t x]", env);
      assert.deepEqual(sensor.values, [false, true]);
    }); 
    test('works with tuples', function() {
      evalString("new r new t run /=![[r] [r] x]./=![[r] [t] x]", env);
      assert.deepEqual(sensor.values, [false, true]);
    }); 
    test('works with complex tuples', function() {
      evalString("new r new t run /=![[r 1 [2 3]] [r 1 [2 3]] x]./=![[4 1 [2 r]] [4 1 [2 t]] x]", env);
      assert.deepEqual(sensor.values, [false, true]);
    }); 
    test('fails if the third argument is not a writeable channel', function() {
      assert.throws(function() {
        evalString("run /=![1 2 z]", env);
      });
    });
    test('fails if the value sent is not a tuple of length 3', function() {
      assert.throws(function() {
        evalString("run /=!2", env);
      });
      assert.throws(function() {
        evalString("run /=![]", env);
      });
    });
  });

});
