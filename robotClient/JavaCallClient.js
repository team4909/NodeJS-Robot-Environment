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

let             id = 0;         // JSON-RPC ID, incremented on each request
let             ret = {};
let             pendingRequests = {};
let             ErrorCode = require("../jsonrpc-server/lib/JsonRpcErrorCode");

async function rpc(method, params)
{
  let             promise;

  // Get a new promise for this request
  promise = new Promise(
    (resolve, reject) =>
      {
        let             request;

        request =
          JSON.stringify(
            {
              "jsonrpc" : "2.0",
              "method"  : method,
              "params"  : params,
              "id"      : "" + ++id
            }) + "\n";

        console.log("Sending: " + request);
        this._client.write(request);

        // Save the resolve and reject functions for when we receive result
        pendingRequests[id] =
          {
            resolve : resolve,
            reject  : reject
          };
      });

  return promise;
}

ret.getDeclaredMethods = async function(clazz)
{
  // Issue the RPC
  return rpc("getDeclaredMethods", [ clazz ]);
};

ret.callJava = async function(obj, method /*, params...*/)
{
  let             params;

  // Retrieve the full list of parameters to callJava
  params = Array.from(arguments);

  // Issue the RPC
  return rpc("callJava", params);
};

ret.newJava = async function(jsJavaInstName, clazz /*, params...*/)
{
  let             params;

  // Retrieve the full list of parameters to newJava
  params = Array.from(arguments);

  // Issue the RPC
  return rpc("newJava", params);
};


/**
 * Create the Java Call client
 *
 * @param ipAddr {String?127.0.0.1}
 *   IP address to connect to
 *
 * @param port {Number?9999}
 *   Port number to connect to
 */
let JavaCallClient = function(ipAddr, port)
{
  let             net = require("net");

  this._client = new net.Socket();

  this._client.connect(
    port || 9999,
    ipAddr || "127.0.0.1",
    function()
    {
      console.log("Connected");
    });

  this._client.on(
    "data",
    function(data)
    {
      let             resolveReject;

      console.log("Received: " + data);

      // Parse the received data
      try
      {
        data = JSON.parse(data);
      }
      catch(e)
      {
        console.log(`\tignored (could not parse: ${e})`);
        return;
      }

      // If there's a 'method' member, it's a request
      if (typeof data.method != "undefined")
      {
        console.log("\tignored (not expecting requests)");
        return;
      }
      
      // There must ben an id member, and either reuslt or error
      if (typeof data.id == "undefined" ||
          (typeof data.result == "undefined" &&
           typeof data.error == "undefined"))
      {
        console.log("\tignored (missing id or result/error member)");
        return;
      }

      // Retrieve the promise, and delete this promise from pending requests
      resolveReject = pendingRequests[id];
      delete pendingRequests[id];

      // Did we find a promise for this ID?
      if (! resolveReject)
      {
        console.log("\tignored (unrecognized id)");
        return;
      }

      // Call the callback with error or result
      if (data.error)
      {
        resolveReject.reject(data.error);
      }
      else
      {
        resolveReject.resolve(data.result);
      }
    });

  this._client.on(
    "close",
    function()
    {
      console.log("Connection closed");
      process.exit(1);
    });

  return ret;
};


module.exports = JavaCallClient;
