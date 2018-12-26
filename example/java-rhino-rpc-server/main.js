var             services = {};
var             registry = {};
var             unique = 0;
var             input;
var             output;
var             request;
var             response;
var             serverSocket;
var             clientSocket;
var             jsonrpcServer;
var             jsonrpc = require("JsonRpcServer.js");

// Register the remote procedure calls we support
registerRpc("echo",     echo,     [ ]);
registerRpc("getDeclaredMethods", getDeclaredMethods,  [ "clazz" ]);
registerRpc("newJava",            newJava,             [ "clazz" ]);
registerRpc("callJava",           callJava,            [ "obj", "method" ]);

// Initialize the JSON-RPC Server, providing it our available methods
jsonrpcServer = new jsonrpc.Server(serviceFactory);

// Create the server socket to listen on
serverSocket = new java.net.ServerSocket(9999);

// Await and accept a client connection
clientSocket = serverSocket.accept();

// Obtain the output and input streams to/from the socket
output = new java.io.PrintWriter(clientSocket.getOutputStream(), true);
input = new java.io.BufferedReader(
          new java.io.InputStreamReader(clientSocket.getInputStream()));

// As long as we continue to receive requests, process them
while (true)
{
  request = input.readLine();
  if (! request)
  {
    break;
  }

  print("Got request:", request);
  response = jsonrpcServer.processRequest(request);
  print("Responding with:", response);
  output.println(response);
}
// End of inline code.




//////////////////////////////////////////////////////////////////////
// Utility Functions
//////////////////////////////////////////////////////////////////////


/**
 * Register a remote procedure call
 *
 * @param serviceName {String}
 *   Name of this service, i.e., the name to use to call this procedure
 *
 * @param fService {Function}
 *   Function to be called when the specified service is requested
 *
 * @param paramNames {Array}
 *   Array of strings representing the (initial) parameter names that
 *   correspond to the formal parameters of the service function. This is used
 *   to allow the client to use a map of parameters rather than an
 *   array... and for the server to fill in with `undefined` any arguments not
 *   provided.
 */
function registerRpc(serviceName, fService, paramNames)
{
  var             f;

  // Use this object as the context for the service
  f = fService.bind(this);

  // Save the parameter names as a property of the function object
  f.parameterNames = paramNames;

  // Save the service
  services[serviceName] = f;
};

/**
 * The service factory takes a method name and attempts to locate a
 * service method that corresponds to that name.
 * 
 * @param methodName {String}
 *   The name of the method to be called.
 * 
 * @param error {JsonRpc.Error}
 *   An error object to be set if an error is encountered in instantiating
 *   the requested serviced method.
 * 
 * @return {Function}
 *   The service method associated with the specified method name.
 */
function serviceFactory(methodName, error)
{
  var f = services[methodName];

  if (! f)
  {
    error.setCode(jsonrpcServer.errorCode.MethodNotFound);
  }

  return f;
};


//////////////////////////////////////////////////////////////////////////////
// REMOTE PROCEDURE CALL IMPLEMENTATIONS
//////////////////////////////////////////////////////////////////////////////


/**
 * Echo the arguments
 *
 * @params argsToBeEchoed {Strings}
 *   One or more arguments to be echoed
 *
 * @param error {JsonRpc.Error}
 *   Error object. Its `setCode`, `setMessage`, and `setData` methods may be
 *   called, and this object returned from an RPC method, if/when an error
 *   occurs.
 */
function echo(/*argsToBeEchoed..., */ error)
{
  var             args;

  // Convert the arguments to a normal array
  args = Array.slice.call(null, arguments);

  // Remove the error parameter
  error = args.pop();

  // Return the arguments
  return args;
}


/**
 * Get the declared methods of a class
 *
 * @param clazz {String}
 *   The name of the class whose methods are to be enumerated
 *
 * @param error {JsonRpc.Error}
 *   Error object. Its `setCode`, `setMessage`, and `setData` methods may be
 *   called, and this object returned from an RPC method, if/when an error
 *   occurs.
 *
 * @return {Array}
 *   List of method names
 */
function getDeclaredMethods(clazz, error)
{
  var             c;
  var             ret;
  
  try
  {
    print("clazz=", clazz);
    c = java.lang.Class.forName(clazz);
    print("c=", c);

    ret =
      c
      .getDeclaredMethods()
      .map(
        function(method)
        {
          return String(method.getName());
        })
      .sort();

    return ret;
  }
  catch(e)
  {
    print("Error:", e);
    return [];
  }
}


/**
 * Instantiate a new Java class instance
 *
 * @param clazz {String}
 *   The name of the class to be instantiated
 *
 * @params constructorArgs {Any}
 *   One or more arguments to be passed to the constructor
 *
 * @param error {JsonRpc.Error}
 *   Error object. Its `setCode`, `setMessage`, and `setData` methods may be
 *   called, and this object returned from an RPC method, if/when an error
 *   occurs.
 *
 * @return {String}
 *   The string identifier of the instance just created
 */
function newJava(clazz /*, constructorArgs..., error*/)
{
  var             f;
  var             obj;
  var             objName;
  var             args;
  var             error;
  var             result;
  var             toExec;

  // Convert the arguments to a normal array
  args = Array.slice.call(null, arguments);

  // Skip clazz
  args.shift();

  // Remove the error argument
  error = args.pop();

  // Convert the arguments to their printable forms
  args = JSON.stringify(args);

  // Strip off the leading '[' and trailing ']'
  args = args.slice(1, args.length - 1);

  // Call the constructor. Retrieve the result.
  toExec = "var ret = new " + clazz + "(" + args + "); return ret;";
  f = new Function(toExec);
  obj = f();

  // Save the object in the registry
  objName = "[" + clazz + "#" + ++unique + "]";
  registry[objName] = obj;

  // Give 'em the name. We'll retain the object in the registry.
  return objName;
}


/**
 * Call a Java method.
 *
 * @param obj {String}
 *   The name of the object (or name of the class, when calling static
 *   methods) on which the method should be called.
 *
 * @param method {String}
 *   The name of the method to be called
 *
 * @params funcArgs {Any}
 *   One or more arguments to be passed to the method
 *
 * @param error {JsonRpc.Error}
 *   Error object. Its `setCode`, `setMessage`, and `setData` methods may be
 *   called, and this object returned from an RPC method, if/when an error
 *   occurs.
 *
 * @return {Any}
 *   The return value from the called Java function
 */
function callJava(obj, method /*, funcArgs..., error*/)
{
  var             f;
  var             args;
  var             error;
  var             result;
  var             toExec;

  // Convert the arguments to a normal array
  args = Array.slice.call(null, arguments);

  // Skip obj and method
  args.shift();
  args.shift();

  // Remove the error argument
  error = args.pop();

  // Convert the arguments to their printable forms
  args = JSON.stringify(args);

  // Strip off the leading '[' and trailing ']'
  args = args.slice(1, args.length - 1);

  if (obj.indexOf("[") != -1)
  {
    obj = registry[obj];
    toExec = "var ret = sourceObj." + method + "(" + args + "); return ret;";
    f = new Function("sourceObj", toExec);
  }
  else
  {
    toExec = "var ret = " + obj + "." + method + "(" + args + "); return ret;";
    f = new Function(toExec);
  }
  result = f(obj);


  return typeof result == "undefined" ? null : result;
}




/*

// Example/test method calls...

response = jsonrpcServer.processRequest(
  JSON.stringify(
    {
      "jsonrpc" : "2.0",
      "method"  : "callJava",
      "params"  : [ "java.lang.System.out", "println", "hello world!" ],
      "id"      : "1"
    }));

response = jsonrpcServer.processRequest(
  JSON.stringify(
    {
      "jsonrpc" : "2.0",
      "method"  : "newJava",
      "params"  : [ "java.io.File", "x" ],
      "id"      : "2"
    }));

print("Response 1=\n" + response);

response = JSON.parse(response);
response = jsonrpcServer.processRequest(
  JSON.stringify(
    {
      "jsonrpc" : "2.0",
      "method"  : "callJava",
      "params"  : [ response.result, "exists" ],
      "id"      : "3"
    }));

print("Response 2=\n" + response);
*/

