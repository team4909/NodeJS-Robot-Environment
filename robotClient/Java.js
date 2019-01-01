/*
 * Copyright:
 *   2018 Derrell Lipman
 *
 * License:
 *   LGPL: http://www.gnu.org/licenses/lgpl.html
 *
 * Authors:
 *   * Derrell Lipman (derrell)
 */

let             unique = 0;     // uniqueness for instance names
let             javaCallClient = require("./JavaCallClient");
const           _defineJavaClass = Symbol("_defineJavaClass");

let Java = class
{
  constructor(javaCallClient)
  {
    // This is a singleton. If we already have the instance, return it.
    if (this._instance)
    {
      return this._instance;
    }

    // Save the new instance
    this._instance = this;

    // Save the client connection to the JSON-RPC server
    this._client = javaCallClient;

    return this;
  }

  
  // Define the JavaScript class by mirroring the Java class and its methods
  [_defineJavaClass](clazz, methods)
  {
    let             c;
    let             obj;
    let             clazzParts;
    let             client = this._client;
    let             _this = this;

    c = class
    {
      constructor()
      {
        // Save the class name
        this._clazz = clazz;

        // Create the instance name shared with the Java side
        this._jsJavaInstName = "[" + clazz + "#" + ++unique + "]";
      }

      // Create an instance of this class
      static async $(/* args... */)
      {
        let             c;
        let             args;
        let             promises;

        // Instantiate a new object of this type
        c = new this();

        args =
          Array.prototype.slice.apply(arguments)
          .map(arg => arg && arg._jsJavaInstName ? arg._jsJavaInstName : arg);

        // Issue the request to instantiate a new object
        await client.newJava(c._jsJavaInstName, clazz, args);

        return c;
      }
    };
    Object.defineProperty(c, "name", { value : clazz });

    // Create each of the class' Java methods as methods in the new JavaScript
    // class.
    methods.forEach(
      (method) =>
        {
          c.prototype[method] = async function()
          {
            let             args;
            let             result;

            // If the constructor request is still in progress...
            if (this._constructorPromise)
            {
              // ... then await it.
              await this._constructorPromise;
              this._constructorPromise = null;
            }

            // Each argument that is a JsJava class built here, should be
            // mapped to its instance name
            args =
              Array.prototype.slice.apply(arguments)
              .map(arg =>
                   arg && arg._jsJavaInstName ? arg._jsJavaInstName : arg);

            // Now we can issue the requested Java call
            result = await _this._client.callJava(
              this._jsJavaInstName,
              method,
              args);
            return result;
          };
        });

    // Beginning at top-level, ensure that all levels of the Java namespace
    // exist in JavaScript namespace
    obj = global;
    clazzParts = clazz.split(".");
    clazzParts.forEach(
      (component, i) =>
        {
          // Handle final component. It gets assigned the class itself
          if (i == clazzParts.length - 1)
          {
            obj[component] = c;
          }

          // If this component doesn't exist, create it
          if (! obj[component])
          {
            obj[component] = {};
          }

          // Move to the that component in preparation for adding the next level
          obj = obj[component];
        });
  }


  /**
   * Import a Java class for use by JavaScript. This creates a JavaScript
   * class that has all of the same methods that the corresponding Java class
   * provides.
   *
   * @param clazz {String}
   *   The class name to mirror from Java
   */
  async import(clazz)
  {
    let             methods;

    try
    {
      // Retrieve the declared methods of the requested class
      methods = await this._client.getDeclaredMethods(clazz);

      // Create the JavaScript class and all of its methods corresponding to the
      // java class' methods
      this[_defineJavaClass](clazz, methods);
    }
    catch(e)
    {
      console.log("Error: ", e);
    }
  }
};

module.exports = Java;
