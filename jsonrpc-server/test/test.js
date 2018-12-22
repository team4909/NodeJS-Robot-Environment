/*
 * Copyright:
 *   2011, 2018 Derrell Lipman
 *
 * License:
 *   LGPL: http://www.gnu.org/licenses/lgpl.html
 *
 * Authors:
 *   * Derrell Lipman (derrell)
 */


/**
 * Unit tests for the JSON-RPC Server
 */

var server = require("../lib/Server");
var assert = require("./Assert");


function ServerTest()
{
  // Start up our RPC server
  this._server = new server.Server(this._serviceFactory.bind(this));

  // Create the services map, containing each of the available RPC services
  this._services = {};

  // Register our RPC services
  this.registerService("subtract",
                       this.subtract,
                       [ "minuend", "subtrahend" ]);
  this.registerService("sum",
                       this.sum,
                       [ ]);
  this.registerService("update",
                       this.update,
                       [ "p1", "p2", "p3", "p4", "p5" ]);
  this.registerService("hello",
                       this.hello,
                       [ "p1" ] );
  this.registerService("get_data",
                       this.get_data,
                       [ ] );

  /** Array of requests to be tested */
  this._tests =
  [
    {
      name :
        'Positional parameters: subtract, initial order of params',
      request :
        '{"jsonrpc": "2.0", "method": "subtract", "params": [42, 23], "id": 1}',
      responses : 
      {
        "jsonrpc": "2.0",
        "result": 19,
        "id": 1
      }
    },

    {
      name :
        'Positional parameters: subtract, reversed order of params',

      request :
        '{"jsonrpc": "2.0", "method": "subtract", "params": [23, 42], "id": 2}',

      responses :
      {
        "jsonrpc": "2.0",
        "result": -19,
        "id": 2
      }
    },

    {
      name :
        'Named parameters: subtract, initial order of params',

      request :
        '{"jsonrpc": "2.0", "method": "subtract", "params": {"subtrahend": 23, "minuend": 42}, "id": 3}',

      responses :
      {
        "jsonrpc": "2.0",
        "result": 19,
        "id": 3
      }
    },

    {
      name :
        'Named parameters: subtract, reversed order of params',

      request :
        '{"jsonrpc": "2.0", "method": "subtract", "params": {"minuend": 42, "subtrahend": 23}, "id": 4}',

      responses :
      {
        "jsonrpc": "2.0",
        "result": 19,
        "id": 4
      }
    },

    {
      name :
        'Notification with existing method',

      request :
        '{"jsonrpc": "2.0", "method": "update", "params": [1,2,3,4,5]}'
    },

    {
      name :
        'Notification with non-existent method',

      request :
        '{"jsonrpc": "2.0", "method": "foobar"}'
    },

    {
      name :
        'Call of non-existent method',

      request :
        '{"jsonrpc": "2.0", "method": "foobar", "id": "1"}',

      responses :
      {
        "jsonrpc": "2.0",
        "error":
        {
          "code" : -32601
        },
        "id": "1"
      }
    },

    {
      name :
        'Invalid JSON',

      request :
        '{"jsonrpc": "2.0", "method": "foobar, "params": "bar", "baz]',

      responses :
      {
        "jsonrpc": "2.0",
        "error":
        {
          "code" : -32700
        },
        "id": null
      }
    },

    {
      name :
        'Invalid Request object',

      request :
        '{"jsonrpc": "2.0", "method": 1, "params": "bar"}',

      responses :
      {
        "jsonrpc": "2.0",
        "error":
        {
          "code" : -32600
        },
        "id": null
      }
    },

    {
      name :
        'Batch with invalid JSON',

      request :
        '[ {"jsonrpc": "2.0", "method": "sum", "params": [1,2,4], "id": "1"},{"jsonrpc": "2.0", "method" ]',

      responses :
      {
        "jsonrpc": "2.0",
        "error":
        {
          "code" : -32700
        },
        "id": null
      }
    },

    {
      name :
        'empty Batch array',

      request :
        '[]',

      responses :
      {
        "jsonrpc": "2.0",
        "error":
        {
          "code" : -32600
        },
        "id": null
      }
    },

    {
      name :
        'Invalid non-empty batch of one',

      request :
        '[1]',

      responses :
      [
        {
          "jsonrpc": "2.0",
          "error":
          {
            "code" : -32600
          },
          "id": null
        }
      ]
    },

    {
      name :
        'Invalid non-empty batch of three',

      request :
        '[1,2,3]',

      responses :
      [
        {
          "jsonrpc": "2.0",
          "error":
          {
            "code" : -32600
          },
          "id": null
        },
        {
          "jsonrpc": "2.0",
          "error":
          {
            "code" : -32600
          },
          "id": null
        },
        {
          "jsonrpc": "2.0",
          "error":
          {
            "code" : -32600
          },
          "id": null
        }
      ]
    },

    {
      name :
        'Batch with mixed success and error',

      request :
        '[' +
        '  {"jsonrpc": "2.0", "method": "sum", "params": [1,2,4], "id": "1"},' +
        '  {"jsonrpc": "2.0", "method": "hello", "params": [7]},' +
        '  {"jsonrpc": "2.0", "method": "subtract", "params": [42,23], "id": "2"},' +
        '  {"foo": "boo"},' +
        '  {"jsonrpc": "2.0", "method": "foo.get", "params": {"name": "myself"}, "id": "5"},' +
        '  {"jsonrpc": "2.0", "method": "get_data", "id": "9"}' +
        ']',

      responses :
        [
          {"jsonrpc": "2.0", "result": 7, "id": "1"},
          {"jsonrpc": "2.0", "result": 19, "id": "2"},
          {"jsonrpc": "2.0", "error": {"code": -32600, "message": "Invalid Request."}, "id": null},
          {"jsonrpc": "2.0", "error": {"code": -32601, "message": "Method not found."}, "id": "5"},
          {"jsonrpc": "2.0", "result": ["hello", 5], "id": "9"}
        ]
    },

    {
      name :
        'Batch with all notifications',

      request :
        '[' +
        '  {"jsonrpc": "2.0", "method": "sum", "params": [1,2,4]},' +
        '  {"jsonrpc": "2.0", "method": "hello", "params": [7]}' +
        ']'
    }
  ];
}


ServerTest.prototype.validateResponseObject =
  function(test, response, index, got, expected)
{
  var             expectedResponse;
  var             expectedKeys;
  var             gotKeys;
  var             idMsg;
  var             field;

  // Get the expected response, if it's one from a batch
  expectedResponse = (index < 0 ? test.responses : test.responses[index]);

  idMsg = 
    ". " + "Expected " + expected + "; Got " + got +
    (index < 0 ? "" : " (index " + index + ")");

  // Validate that we got the expected keys in the response
  expectedKeys = Object.keys(expectedResponse).sort();
  gotKeys = Object.keys(response).sort();
  assert.assertArrayEquals(expectedKeys, gotKeys, "Differing keys" + idMsg);

  // Validate the individual field data
  assert.assertIdentical(expectedResponse.jsonrpc,
                       response.jsonrpc,
                       "jsonrpc field mismatch" + idMsg);
  assert.assertIdentical(expectedResponse.id,
                       response.id,
                       "id field mismatch" + idMsg);

  if (typeof(expectedResponse.result) !== "undefined")
  {
    // It's a successful response
    assert.assertJsonEquals(expectedResponse.result, response.result);
  }
  else
  {
    // It's an error response. Only test the error code.
    assert.assertObject(response.error, "Missing error object");
    assert.assertIdentical(expectedResponse.error.code,
                         response.error.code,
                         "Mismatched error code" + idMsg);
  }
  };

/** Test all requests */
ServerTest.prototype.testAll = function()
{
  this._tests.forEach(
    function(test)
    {
      var             jsonResponse;
      var             responses;
      var             expected = JSON.stringify(test.responses);

      // Display the test name
      console.log(test.name);

      // Pass this request to the server
      jsonResponse = this._server.processRequest(test.request);

      // We got back a JSON response. Parse it.
      responses = JSON.parse(jsonResponse);

      // Validate the response type
      if (typeof test.responses == "undefined")
      {
        assert.assertNull(responses, 
                        "Expected null response. " +
                        "Expected " + expected + "; " +
                        "Got " + jsonResponse);
      }
      else if (Array.isArray(test.responses))
      {
        assert.assertArray(responses, "Expected array response");
        test.responses.forEach(
          function(response, i)
          {
            this.validateResponseObject(test, response, i,
                                        jsonResponse, expected);
          },
          this);
      }
      else
      {
        assert.assertObject(responses, "Expected object response");
        this.validateResponseObject(test, responses, -1,
                                    jsonResponse, expected);
      }
    },
    this);
  assert.assertEquals(4, 3+1, "This should never fail!");
  assert.assertFalse(false, "Can false be true?!");
};

/**
 * The service factory takes a method name and attempts to produce a
 * service method that corresponds to that name.
 * 
 * @param methodName {String}
 *   The name of the method to be called.
 * 
 * @param error {liberated.rpc.error.Error}
 *   An error object to be set if an error is encountered in instantiating
 *   the requested serviced method.
 * 
 * @return {Function}
 *   The service method associated with the specified method name.
 */
ServerTest.prototype._serviceFactory = function(methodName, error)
{
  var f = this._services[methodName];

  if (! f)
  {
    error.setCode(server.errorCode.MethodNotFound);
  }

  return f;
};

/**
 * Register a service name and function.
 *
 * @param serviceName {String}
 *   The name of this service within the <rpcKey>.features namespace.
 *
 * @param fService {Function}
 *   The function which implements the given service name.
 * 
 * @param paramNames {Array}
 *   The names of the formal parameters, in order.
 */
ServerTest.prototype.registerService =
  function(serviceName, fService, paramNames)
{
  var             f;

  // Use this object as the context for the service
  f = fService.bind(this);

  // Save the parameter names as a property of the function object
  f.parameterNames = paramNames;

  // Save the service
  this._services[serviceName] = f;
};

ServerTest.prototype.subtract = function(minuend, subtrahend)
{
  return minuend - subtrahend;
};

ServerTest.prototype.sum = function()
{
  var sum = 0;
  var args = Array.slice.call(null, arguments);
  var error = args.pop();
  args.forEach(
    function(arg)
    {
      sum += arg;
    });
  return sum;
};

ServerTest.prototype.update = function(p1, p2, p3, p4, p5)
{
  return true;
};

ServerTest.prototype.hello = function(p1)
{
};

ServerTest.prototype.get_data = function()
{
  return [ "hello", 5 ];
};


//
// LET THE FUN BEGIN!!!
//

var test = new ServerTest();
test.testAll();
