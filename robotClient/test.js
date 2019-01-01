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
