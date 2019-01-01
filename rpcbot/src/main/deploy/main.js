/*
 * Copyright:
 *   2018 Derrell Lipman
 *
 * License:
 *   LGPL: http://www.gnu.org/licenses/lgpl.html
 *
 * Authors:
 *   Derrell Lipman (derrell)
 */

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

print("JavaScript main() loading...");

// Register the remote procedure calls we support
registerRpc("echo",     echo,     [ ]);
registerRpc("getDeclaredMethods", getDeclaredMethods,  [ "clazz" ]);
registerRpc("newJava",            newJava,             [ "clazz" ]);
registerRpc("callJava",           callJava,            [ "obj", "method" ]);

// Initialize the JSON-RPC Server, providing it our available methods
jsonrpcServer = new jsonrpc.Server(serviceFactory);

// Create a server socket to listen on
serverSocket = new java.net.ServerSocket(9999);

for (;;)
{
  // Await and accept a client connection
  print("JSON RPC Server waiting on port 9999...");
  clientSocket = serverSocket.accept();
  print("JSON RPC Server connected");

  // Obtain the output and input streams to/from the socket
  output = new java.io.PrintWriter(clientSocket.getOutputStream(), true);
  input = new java.io.BufferedReader(
            new java.io.InputStreamReader(clientSocket.getInputStream()));

  // As long as we continue to receive requests, process them
  for (;;)
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

/**
 * Map any arguments which are Java object references to their Java object.
 * 
 * @param {Array} args 
 *   Arguments to be mapped
 * 
 * @return {Array}
 *   Mapped array of arguments.
 */
function mapArgsToRegistry(args)
{
  var         ret;
  
  ret = args.map(
    function(arg)
    {
      if (typeof arg == "string" && arg[0] == '[' && arg[arg.length - 1] == ']')
      {
        arg = "registry['" + arg + "']";
      }

      return arg;
    }
  );

  return ret;
}

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
 * @param jsJavaInstName {String}
 *   The identifier to reference the new Java object by, on the JavaSCript side
 * 
 * @param clazz {String}
 *   The name of the class to be instantiated
 *
 * @params args {Array}
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
function newJava(jsJavaInstName, clazz, args, error)
{
  var             f;
  var             obj;
  var             args;
  var             error;
  var             result;
  var             toExec;

  // Map any argument strings in the registry to their object
  args = mapArgsToRegistry(args);

  // Call the constructor. Retrieve the result.
  toExec = [ "var ret = new " + clazz + "(" ];
  args.forEach(
    function(arg, i)
    {
      var       formatted;
      if (i !== 0)
      {
        toExec.push(", ");
      }
      
      // Convert the arguments to their printable forms and
      if (typeof arg == "string" && arg.substr(0, 9) == "registry[")
      {
        toExec.push(arg);
      }
      else
      {
        // JSON stringify to escape strings.
        // Strip off the leading '[' and trailing ']' leaving just the value
        formatted = JSON.stringify( [ arg ]);
        formatted = formatted.slice(1, formatted.length - 1);
        toExec.push(formatted);
      }
    });
  toExec.push("); return ret;");

  toExec = toExec.join("");
  f = new Function(toExec);
  obj = f();

  // Save the object in the registry
  registry[jsJavaInstName] = obj;

  // Give 'em the name. We'll retain the object in the registry.
  return jsJavaInstName;
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
 * @params args {Array}
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
function callJava(obj, method, args, error)
{
  var             f;
  var             args;
  var             error;
  var             result;
  var             toExec;

  // Map any argument strings in the registry to their object
  args = mapArgsToRegistry(args);

  // Call the method. Retrieve the result.
  if (typeof obj == "string" && obj[0] == '[' && obj[obj.length - 1] == ']')
  {
    toExec = "var ret = registry['" + obj + "']." + method + "(" + args + "); return ret;";
    f = new Function(toExec);
  }
  else
  {
    // Convert the arguments to their printable forms
    args = JSON.stringify(args);

    // Strip off the leading '[' and trailing ']'
    args = args.slice(1, args.length - 1);

    toExec = "var ret = " + obj + "." + method + "(" + args + "); return ret;";
    f = new Function(toExec);
  }

  result = f(obj);
  return typeof result == "undefined" ? null : result;
}