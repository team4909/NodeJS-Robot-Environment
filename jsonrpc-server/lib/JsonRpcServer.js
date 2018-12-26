/*
 * Copyright:
 *   2011, 2018 Derrell Lipman
 *
 * License:
 *   LGPL: http://www.gnu.org/licenses/lgpl.html
 *
 * Authors:
 *   Derrell Lipman (derrell)
 */

/*
 * JSON-RPC Server
 *
 * This is intended to be run on Rhino 1.7.9 which has poor support for
 * ES6. It is therefore written in more traditional JavaScript style.
 */

// Get the common error codes
var ErrorCode = require("JsonRpcErrorCode");

/**
 * Error Response class used internally.
 */
function ErrorResponse()
{
  this._code = ErrorCode.InvalidRequest;
  this._message = "Unspecified error";
  this._data = null;
}

/**
 * this._code
 *
 * The error code, i.e., one of the ErrorCode values.
 */
ErrorResponse.prototype.setCode = function(value)
{
  this._code = value;
};
ErrorResponse.prototype.getCode = function()
{
  return this._code;
};

/**
 * this._message
 *
 * A descriptive message for the error.
 */
ErrorResponse.prototype.setMessage = function(value)
{
  this._message = value;
};
ErrorResponse.prototype.getMessage = function()
{
  return this._message;
};

/**
 * this._data
 *
 * A primitive or structured value that contains additional information
 * about the error. It is optional.
 */
ErrorResponse.prototype.setData = function(value)
{
  this._data = value;
};
ErrorResponse.prototype.getData = function()
{
  return this._data;
};

/**
 * Generate a string representation of the rror
 */
ErrorResponse.prototype.stringify = function()
{
  var             data;
  var             error;

  // Create an object which will contain the appropriate members
  error = {};

  error.code = this._code;
  error.message = this._message;

  // See if there's any data
  data = this._data;
  if (data !== null)
  {
    // There is, so return it.
    error.data = data;
  }

  // Format the error object into a JSON response
  return JSON.stringify(error);
};



/******************
 * JSON-RPC server
 ******************

/**
 * Constructor for a JSON_RPC server.
 *
 * @param serviceFactory {Function}
 *   A function which provides an interface to a service method. The
 *   function will be called with a namespaced method name, and an
 *   ErrorResult object. Under normal circumstances (success), it should
 *   return a function reference. If the method identified by name is not
 *   available, either because it does not exist, or for some other reason
 *   (e.g. the function's was called in a cross-domain fashion but the
 *   function is not permitted to be used in that fashion), the provided
 *   error object's methods should be used to provide details of the error,
 *   and then the error object should be returned.
 */
function Server(serviceFactory)
{
  // The service factory is mandatory
  if (typeof serviceFactory != "function")
  {
    throw new Error("Missing service factory function");
  }

  // Save the parameters for future use
  this._factory = serviceFactory;
}

/**
 * Process a single remote procedure call request.
 *
 * @param jsonInput {String}
 *   The input string, containing the JSON-encoded RPC request.
 *
 * @return {String}
 *   The JSON response.
 */
Server.prototype.processRequest = function(jsonInput)
{
  var             i;
  var             timer;      // timeout object
  var             ret;        // error return object
  var             bBatch;     // whether a batch request is received
  var             requests;   // the parsed input request
  var             error;      // an error object
  var             reply;      // a textual reply in case garbage input
  var             fqMethod;   // fully-qualified method name
  var             service;    // service function to call
  var             result;     // result of calling service function
  var             parameters; // the parameter list for the RPC
  var             run;        // function to run the service call
  var             responses;  // array of responses (in case of batch)

  try
  {
    // Parse the JSON
    requests = JSON.parse(jsonInput);
  }
  catch(e)
  {
    // We couldn't parse the request.
    // Get a new error object.
    error = new ErrorResponse();
    error.setCode(ErrorCode.ParseError);
    error.setMessage("Could not parse request");

    // Build the error response
    ret = 
      {
        jsonrpc : "2.0",
        id      : null,
        error   : JSON.parse(error.stringify())
      };

    return JSON.stringify(ret);
  }

  // Determine if this is normal or batch mode
  if (Array.isArray(requests))
  {
    // It's batch mode.
    bBatch = true;

    // Ensure that there's at least one element in the array
    if (requests.length === 0)
    {
      // Get a new error object.
      error = new ErrorResponse();
      error.setCode(ErrorCode.InvalidRequest);
      error.setMessage("Empty batch array");

      // Build the error response
      ret = 
        {
          jsonrpc : "2.0",
          id      : null,
          error   : JSON.parse(error.stringify())
        };

      return JSON.stringify(ret);
    }
  }
  else if (isObject(requests))
  {
    // It's normal mode
    bBatch = false;

    // Create an array as if it were batch mode
    requests = [ requests ];
  }
  else
  {
    // Get a new error object.
    error = new ErrorResponse();
    error.setCode(ErrorCode.InvalidRequest);
    error.setMessage("Unrecognized request type");
    error.setData("Expected an array or an object");

    // Build the error response
    ret = 
      {
        jsonrpc : "2.0",
        id      : null,
        error   : JSON.parse(error.stringify())
      };

    return JSON.stringify(ret);
  }

  // For each request in the batch (or the single non-batch request)...
  responses = requests.map(
    function(request)
    {
      var             ret;
      var             id;

      // Get the id value to use in error responses
      id = typeof request.id == "undefined" ? null : request.id;

      // Ensure that this is a valid request object
      if (! isObject(request))
      {
        // Get a new error object.
        error = new ErrorResponse();
        error.setCode(ErrorCode.InvalidRequest);
        error.setMessage("Unrecognized request");
        error.setData("Expected an object");

        // Build the error response
        ret = 
          {
            jsonrpc : "2.0",
            id      : id,
            error   : JSON.parse(error.stringify())
          };

        return ret;
      }

      // Validate parameters
      if (typeof request.jsonrpc == "string")
      {
        // Yup. It had better be "2.0"!
        if (request.jsonrpc != "2.0")
        {
          error = new ErrorResponse();
          error.setCode(ErrorCode.InvalidRequest);
          error.setMessage("'jsonrpc' member must be \"2.0\".");
          error.setData("Found value " + request.jsonrpc + "in 'jsonrpc'.");

          // Build the error response
          ret = 
            {
              jsonrpc : "2.0",
              id      : id,
              error   : JSON.parse(error.stringify())
            };

          return ret;
        }

        // Validate that the method is a string
        if (typeof request.method != "string")
        {
          error = new ErrorResponse();
          error.setCode(ErrorCode.InvalidRequest);
          error.setMessage("JSON-RPC method name is missing or " +
                           "incorrect type");
          error.setData("Method name must be a string.");

          // Build the error response
          ret = 
            {
              jsonrpc : "2.0",
              id      : id,
              error   : JSON.parse(error.stringify())
            };

          return ret;
        }

        // Validate that the params member is undefined, an object, or an
        // array.
        if (typeof request.params != "undefined" &&
            ! isObject(request.params) &&
            ! Array.isArray(request.params))
        {
          error = new ErrorResponse();
          error.setCode(ErrorCode.InvalidRequest);
          error.setMessage("JSON-RPC params is missing or incorrect type");
          error.setData("params must be undefined, an object, or an array.");

          // Build the error response
          ret = 
            {
              jsonrpc : "2.0",
              id      : id,
              error   : JSON.parse(error.stringify())
            };

          return ret;
        }
      }
      else
      {
        error = new ErrorResponse();
        error.setCode(ErrorCode.InvalidRequest);
        error.setMessage("JSON-RPC protocol version is missing.");
        error.setData("Expected 'jsonrpc:\"2.0\"'");

        // Build the error response
        ret = 
          {
            jsonrpc : "2.0",
            id      : id,
            error   : JSON.parse(error.stringify())
          };

        return ret;
      }

      // Generate the fully-qualified method name
      fqMethod = request.method;

      /*
       * Ensure the requested method name is kosher.  It should be:
       *
       *   First test for:
       *   - a dot-separated sequences of strings
       *   - first character of each string is in [a-zA-Z] 
       *   - other characters are in [_a-zA-Z0-9]
       *
       *   Then verify:
       *   - no two adjacent dots
       */

      // First test for valid characters
      if (! /^[a-zA-Z][_.a-zA-Z0-9]*$/.test(fqMethod))
      {
        // There's some illegal character in the service or method name
        error = new ErrorResponse();
        error.setCode(ErrorCode.MethodNotFound);
        error.setMessage("Illegal character found in service name.");

        // Build the error response
        ret = 
          {
            jsonrpc : "2.0",
            id      : id,
            error   : JSON.parse(error.stringify())
          };

        return ret;
      }

      // Next, ensure there are no double dots
      if (fqMethod.indexOf("..") != -1)
      {
        error = new ErrorResponse();
        error.setCode(ErrorCode.MethodNotFound);
        error.setMessage("Illegal use of two consecutive dots " +
                         "in service name.");

        // Build the error response
        ret = 
          {
            jsonrpc : "2.0",
            id      : id,
            error   : JSON.parse(error.stringify())
          };

        return ret;
      }

      // Use the registered callback to get a service function associated
      // with this method name.
      error = new ErrorResponse();
      service = this._factory(fqMethod, error);

      // Was there an error?
      if (service == null)
      {
        // Yup. Is this a notification?
        if (typeof request.id == "undefined")
        {
          // Yes. Just return undefined so the error is ignored.
          return undefined;
        }

        // Build error response. The error was set in the service factory.
        ret = 
          {
            jsonrpc : "2.0",
            id      : request.id,
            error   : JSON.parse(error.stringify())
          };

        return ret;
      }

      // Were we given a parameter array, or a parameter map, or none?
      // First, was it an array?
      if (Array.isArray(request.params))
      {
        // It's an array. Use it as the parameter list
        parameters = request.params;

        // If there are missing (optional) parameters...
        if (service.parameterNames && 
            service.parameterNames.length > parameters.length)
        {
          // ... then pass undefined for each of those
          for (i = parameters.length; 
               i < service.parameterNames.length; 
               i++)
          {
            parameters.push(undefined);
          }
        }
      }

      // Was it a parameter map, and does the service allow a parameter map?
      else if (isObject(request.params) && service.parameterNames)
      {
        // Yup. Initialize to an empty parameter list
        parameters = [];

        // Map the arguments into the parameter array. (We are 
        // forgiving of members of request.params that are not
        // in the formal parameter list. We just ignore them.)
        service.parameterNames.forEach(
          function(paramName)
          {
            // Add the parameter. If it's undefined, so be it.
            parameters.push(request.params[paramName]);
          });
      }

      // Was it a parameter map without the service allowing a parameter map?
      else if (isObject(request.params))
      {
        error = new ErrorResponse();
        error.setCode(ErrorCode.InvalidParams);
        error.setMessage("Service does not allow a parameter map");

        // Build the error response
        ret = 
          {
            jsonrpc : "2.0",
            id      : id,
            error   : JSON.parse(error.stringify())
          };

        return ret;
      }

      // If nothing else, no parameters were provided, which is equivalent
      // to an empty list
      else
      {
        parameters = [];

        // If there are missing (optional) parameters...
        if (service.parameterNames && 
            service.parameterNames.length > parameters.length)
        {
          // ... then pass undefined for each of those
          for (i = parameters.length; 
               i < service.parameterNames.length; 
               i++)
          {
            parameters.push(undefined);
          }
        }
      }

      // Create a function that will run this one request. We do this to
      // allow notifications to be run after we return from
      // processRequest().
      run = function(request)
      {
        var             result;
        var             params = JSON.parse(JSON.stringify(parameters));
        var             timer = {}; // just a reference to compare to

        // Provide the error object as the last parameter.
        params.push(error); 

        // We should now have a service function to call. Call it.
        try
        {
          result = service.apply(null, params);
        }
        catch(e)
        {
          // The service method threw an error. Create our own error from
          // it.
          error = new ErrorResponse();
          error.setCode(ErrorCode.InternalError);

          // Combine the message from the original error
          error.setMessage("Method threw an error: " + e);

          // Use this error as the result
          result = error;
        }

        return result;
      }.bind(this);

      // Is this request a notification?
      if (typeof request.id == "undefined")
      {
        // Yup. Schedule this method to be called later, but ASAP. We
        // don't care about the result, so we needn't wait for it to
        // complete.
        setTimeout(
          function()
          {
            run(request);
          }, 
          0);

        // Set result to the timer object, so we'll ignore it, below.
        result = timer;
      }
      else
      {
        // It's not a notification. Run requested service method now.
        result = run(request);
      }

      // Was this a notification?
      if (result === timer)
      {
        // Yup. Return undefined so it'll be ignored.
        return undefined;
      }

      // Was the result an error?
      if (result instanceof ErrorResponse)
      {
        // Yup. Stringify and return it.
        // The error class knows how to stringify itself, but we need a map.
        // Go both directions, to obtain the map.

        // Build the error response
        ret = 
          {
            jsonrpc : "2.0",
            id      : request.id,
            error   : JSON.parse(result.stringify())
          };

        return ret;
      }

      // We have a standard result. Stringify and return a proper response.
      ret = 
        {
          jsonrpc : "2.0",
          id      : request.id,
          result  : result
        };

      return ret;
    },
    this);

  // Remove any responses that were for notifications (undefined ones)
  responses = responses.filter(
    function(response)
    {
      return typeof response !== "undefined";
    });

  // Is there a response, i.e. were there any non-notifications?
  if (responses.length == 0)
  {
    // Nope. Return null to indicate that no response should be returned.
    return null;
  }

  // Give 'em the response(s)
  return (bBatch
          ? JSON.stringify(responses)
          : JSON.stringify(responses[0]));
}


/*
 * Utility functions
 */

function isObject(o)
{
  return o !== null && typeof o == "object";
}


module.exports =
  {
    Server     : Server,
    errorCode  : ErrorCode
  };
