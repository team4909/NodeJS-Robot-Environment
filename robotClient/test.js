async function main()
{
  let             motorLeft;
  let             motorRight;
  let             drivetrainDriveControl;
  let             javaCallClient = require("./JavaCallClient")("10.49.9.2");
  let             javaInterface = new (require("./Java"))(javaCallClient);

  await javaInterface.import("edu.wpi.first.wpilibj.Spark");
  await javaInterface.import("edu.wpi.first.wpilibj.RobotDrive");

  motorLeft = await edu.wpi.first.wpilibj.Spark.$(0);
  motorRight = await edu.wpi.first.wpilibj.Spark.$(1);

  drivetrainDriveControl =
    await edu.wpi.first.wpilibj.RobotDrive.$(motorLeft, motorRight);
  
  await drivetrainDriveControl.arcadeDrive(0.5, 0);
}

main();
