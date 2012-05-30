if(typeof module !== 'undefined') {
  var chai = require('chai');
  var pike = require('../pike');
  var thunk = require('../continuations').thunk;
  var eval = pike.eval;
  var evalString = pike.evalString;
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
          return [next];
        }
      };
};

var makeInjector = function() {
  return {
        nextValue: 0,
        receive: function(receiver) {
          return this.respondWith( receiver, this.nextValue++ );
        },
        respondWith: function(receiver, value) {
          return [ thunk(receiver, value) ];
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
    env = { bindings: { x: sensor, z: injector, y: 2 }, outer: null };
  });

  suite('Nil process', function() {
    test('Does nothing', function() {
      evalString("()");
    });
  });
  suite('Send', function() {
    test('send sends the value to the channel', function() {
      evalString("x!y.()", env);
      assert.deepEqual(sensor.values, [ 2 ]);
    });
    test('evaluation continues after send is received', function() {
      evalString("x!y.x!y.()", env);
      assert.deepEqual(sensor.values, [ 2, 2 ]);
    });
    test('evaluation only proceeds when channel allows', function() {
      sensor.respondWith = function(next) { return []; };
      evalString("x!y.x!y.()", env);
      assert.deepEqual(sensor.values, [ 2 ]);
    });
  });
  suite('Receive', function() {
    test('Receive calls receive on channel with function to accept value', function() {
      evalString("z?y.()", env);
      assert.deepEqual(injector.nextValue, 1);
    });      
    test('Receive binds variable in local environment and makes it available in the rest of the process', function() {
      evalString("z?t.x!t.()", env);
      assert.isUndefined(env.bindings.t);
      assert.deepEqual(sensor.values, [ 0 ]);
    });
    test('Receive shadows variables bound in outer environment', function() {
      evalString("z?y.x!y.()", env);
      assert.deepEqual(2, env.bindings.y);
      assert.deepEqual(sensor.values, [ 0 ]);
    });
    test('evaluation only proceeds when channel allows', function() {
      injector.respondWith = function() { return []; };
      evalString("z?y.x!y.()", env);
      assert.deepEqual(sensor.values, []);
    });
  });
  suite('Replicated Receive', function() {
    test('replicates itself after receive', function () {
      injector.respondWith = function(receiver, value) {
        if(value < 3) {
          return [ thunk(receiver, value) ];
        } else {
          return [];
        }
      };
      evalString("z?*y.x!y.()", env);
      assert.deepEqual(sensor.values, [0, 1, 2]);
    });
  });
  suite('Parallel', function() {
    test('Runs all processes', function() {
      evalString("z?t.x!t.()|x!y.()", env);
      assert.deepEqual(sensor.values, [2, 0]);
    });
  });
  suite('New', function() {
    test('creates a channel and binds it to the name for the process', function() {
      evalString("new(n).x!n.()", env);
      assert.deepEqual(sensor.values[0].isChannel, true);
    });
    var assertReceiveValues = function(channel, expectedProcess, expectedValue) {
      var func = function() {};
      var thunks = channel.receive(func);
      assert.deepEqual(thunks[0].args[0], expectedProcess);
      assert.deepEqual(thunks[1], { tag: 'thunk', func: func, args: [ expectedValue ] });
    };
    test('created channel buffers sends until a receive occurs', function() {
      evalString("new(t).(z?n.t!n.z?g.()|z?n.t!n.()|x!t.())", env);
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
      evalString("new(t).(t?g.g!y.()|t?g.()|x!t.())", env);
      var t = sensor.values[0];
      assertSendValues(t, { tag: '!', channel: 'g', value: 'y', next: { tag: 'nil' }}); 
    });
  });
});