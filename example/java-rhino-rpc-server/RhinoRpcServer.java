import java.util.Arrays;
import java.util.List;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.commonjs.module.Require;
import org.mozilla.javascript.tools.shell.Global;

public class RhinoRpcServer
{
  public static void main(String[] args)
  {
    Context           ctx;
    Scriptable        exports;
    Global            global;
    Require           require;
    List<String>      modulePaths;

    // Build the list of directories where modules will be found (in
    // addition to current directory, ".")
    modulePaths =
      Arrays.asList("../../jsonrpc-server/lib:./modules".split(":"));

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
}
