This example shows how a JSON-RPC server running under Rhino (as if it would
be when running on the RoboRIO when compiled into a Java app there), can
call arbitrary Java methods upon request of a peer NodeJS client.  There are
three remote procedure calls implemented:

- echo
  - Return the arguments
- newJava
  - Instantiate a new Java object of a given class
- callJava
  - Call a given method of a given Java object

To run it, given a normal Linux environment:
- Compile the Java code:
  - javac -cp ".:rhino-1.7.9.jar" RhinoRpcServer.java
- Run the Java server
  - java -cp ".:rhino-1.7.9.jar" RhinoRpcServer
  - This loads and runs the JavaScript file `main.js`
- Run the NodeJS client, which issues a single `echo` request
  - nodejs client.js
