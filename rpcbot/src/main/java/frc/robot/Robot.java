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

 /*
 * Remote Procedure Call robot
 * 
 * This robot has little code of its own to control the robot. Rather,
 * it provides a JSON-RPC (JavaScript Object Notation - Remote Procedure Call)
 * server to which an external process attaches and controls the robot.
 * 
 * Author: Derrell Lipman
 */


package frc.robot;

import java.util.List;
import java.util.Arrays;
import edu.wpi.first.hal.HAL;
import edu.wpi.first.wpilibj.SampleRobot;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.commonjs.module.Require;
import org.mozilla.javascript.tools.shell.Global;

public class Robot extends SampleRobot 
{
  private Character mode;
  private Character oldMode;
  
  public Robot()
  {
    super();


    // Initialize current and prior mode to invalid mode values
    // since we're not yet in any particular mode.
    mode = '\0';
    oldMode = '\0';
  }
  
  protected void robotInit()
  {
    Context           ctx;
    Global            global;
    Require           require;
    Scriptable        exports;
    List<String>      modulePaths;

    System.out.println("Robot server starting up now...");

    // Tell the DS that the robot is ready to be enabled
    HAL.observeUserProgramStarting();

    // Build the list of directories where modules will be found (in
    // addition to current directory, ".")
    modulePaths = Arrays.asList("home/lvuser/deploy".split(":"));

    // Prepare to use JavaScript!
    ctx = Context.enter();

    try
    {
      // Global sets up for multi-threading (which we don't need), but more
      // importantly, creates all of the Rhino Shell utilities such as
      // print(), that it's nice to have.
      global = new Global();
      global.setSealedStdLib(true);
      global.init(ctx);

      // Prepare to have require() capability
      require = global.installRequire(ctx, modulePaths, false);

      // Load and run main module
      exports = require.requireMain(ctx, "main.js");
    }
    catch(Exception e)
    {
      System.out.println("ERROR: " + e.toString());
    }
    finally
    {
      Context.exit();
    }
  }

  /**
   * Retrieve the current and prior mode. Each mode is a character indicating:
   *   '\0' : no mode set yet (only visible to user code as oldMode)
   *   'A'  : Autonomous
   *   'O'  : Operator Control
   *   'T'  : Test
   * 
   * @return
   *   An array of two values: the current mode, and the prior (old) mode.
   */
  public Character[] getModes()
  {
    return new Character[] {mode, oldMode};
  }


  @Override
  public void autonomous() 
  {
    if (mode != 'A')
    {
      System.out.println("Mode changing from " + mode + " to A");

      // Mode changed. Set oldMode to what it was, and mode to what it now is.
      oldMode = mode;
      mode = 'A';
    }
  }

  @Override
  public void operatorControl()
  {
    if (mode != 'O')
    {
      System.out.println("Mode changing from " + mode + " to O");

      // Mode changed. Set oldMode to what it was, and mode to what it now is.
      oldMode = mode;
      mode = 'O';
    }
  }

  @Override
  public void test()
  {
    if (mode != 'T')
    {
      System.out.println("Mode changing from " + mode + " T");

      // Mode changed. Set oldMode to what it was, and mode to what it now is.
      oldMode = mode;
      mode = 'T';
    }
  }
}
