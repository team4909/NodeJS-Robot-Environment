var net = require("net");
var client = new net.Socket();
client.connect(
  9999,
  "127.0.0.1",
  function()
  {
    console.log("Connected");
/*
    client.write(
      JSON.stringify(
        {
          "jsonrpc" : "2.0",
          "method"  : "callJava",
          "params"  : [ "java.lang.System.out", "println", "hello world!" ],
          "id"      : "1"
        }) + "\n");
*/
    client.write(
      JSON.stringify(
        {
          "jsonrpc" : "2.0",
          "method"  : "echo",
          "params"  : [ "hello", "world" ],
          "id"      : "1"
        }) + "\n");

  });

client.on(
  "data",
  function(data)
  {
    console.log("Received: " + data);
    client.destroy();
  });

client.on(
  "close",
  function()
  {
    console.log("Connection closed");
  });
