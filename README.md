# NodeJS-Robot-Environment
A NodeJS-based JavaScript environment for FRC Robotics 

The goal here is to play with writing JavaScript code to control robots. The
concept, as currently implemented, is that the robot runs the Java
environment, including a remote procedure call server
([example](https://github.com/FRCteam4909/NodeJS-Robot-Environment/tree/master/example/java-rhino-rpc-server))
that runs with the assistance of the Rhino JavaScript engine, and has full
interactivity with the Java environment of WPILIB. A JavaScript client running
with NodeJS, then, can, with little up-front work, instantiate a JavaScript
class that mirrors the Java class, and manipulate the robot remotely.

Here is a simple example, written prior to operating in the robot environment
so using plain Java objects, that demonstrates the concept. This is client
code, running in NodeJS, communicating with a server running in Rhino:

```
async function main()
{
  let             javaCallClient = require("./JavaCallClient")();
  let             javaInterface = new require("./Java")(javaCallClient);

  // Import the Java classes we will want to use
  await javaInterface.import("java.io.File");

  // Instantiate the newly-imported class
  let file = new java.io.File("x.y");

  // Call a method on that class, awaiting its result.
  console.log("file.exists=", await file.exists());
}

main();
```

See the
[wiki](https://github.com/FRCteam4909/NodeJS-Robot-Environment/wiki) for
design goals and early (pre-implementation) discussion on this topic.
