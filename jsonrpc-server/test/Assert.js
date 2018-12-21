/**
 * Asserts, borrowed from qooxdoo. Some qooxdoo asserts elided.
 */

module.exports =
{
  /**
   * Assert that the condition evaluates to <code>true</code>. An
   * {@link AssertionError} is thrown if otherwise.
   *
   * @param comment {String} Message to be shown if the assertion fails. This
   *    message is provided by the user.
   * @param msgvarargs {var}
   *   Any number of parts of a message to show if assertion triggers. Each
   *   will be converted to a string and all parts will be
   *   concatenated.
   *
   */
  __fail : function(comment, msgvarargs)
  {
    // Build up message from message varargs. It's not really important
    // how long this takes as it is done only when assertion is triggered
    var msg = "";
    for (var i=1, l=arguments.length; i<l; i++)
    {
      msg =
        msg + this.__toString(arguments[i] === undefined
                              ? "'undefined'"
                              : arguments[i]);
    }

    var fullComment = "";
    if (msg)
    {
      fullComment = comment + ": " + msg;
    }
    else
    {
      fullComment = comment;
    }
    var errorMsg = "Assertion error! " + fullComment;
    throw new Error(errorMsg);
  },


  /**
   * Print a list of arguments using a format string
   * In the format string occurrences of %n are replaced by the n'th element
   * of the args list.
   *
   * @param pattern {String} format string
   * @param args {Array} array of arguments to insert into the format string
   * @return {String} the formatted string
   */
  __format : function(pattern, args)
  {
    var str = pattern;
    var i = args.length;

    while (i--)
    {
      // be sure to always use a string for replacement.
      str = str.replace(
        new RegExp("%" + (i + 1), "g"),
        function()
        {
          return args[i] + "";
        });
    }

    return str;
  },


  /**
   * Convert an unknown value to a string to display in error messages
   *
   * @param value {var} any value
   * @return {String} a string representation of the value
   */
  __toString : function(value)
  {
    var stringValue;

    if (value === null)
    {
      stringValue = "null";
    }
    else if (Array.isArray(value) && value.length > 10)
    {
      stringValue = "Array[" + value.length + "]";
    } else if ((value instanceof Object) && (value.toString == null))
    {
      stringValue = JSON.stringify(value, null, 2);
    } else
    {
      try {
        stringValue = value.toString();
      } catch(e) {
        stringValue = "";
      }
    }
    return stringValue;
  },


  /**
   * Assert that the condition evaluates to <code>true</code>.
   *
   * @param condition {var} Condition to check for. Must evaluate to
   *    <code>true</code>.
   * @param msg {String?} Message to be shown if the assertion fails.
   */
  assert : function(condition, msg)
  {
    condition == true ||
      this.__fail(
        msg || "",
        "Called assert with 'false'");
  },


  /**
   * Raise an {@link AssertionError}.
   *
   * @param msg {String} Message to be shown if the assertion fails.
   * @param compact {Boolean?false} Show less verbose message. Default: false.
   */
  fail : function(msg, compact)
  {
    var msgvarargs = compact ? "" : "Called fail().";
    this.__fail(msg || "", msgvarargs);
  },


  /**
   * Assert that the value is <code>true</code> (Identity check).
   *
   * @param value {Boolean} Condition to check for. Must be identical to
   *    <code>true</code>.
   * @param msg {String?} Message to be shown if the assertion fails.
   */
  assertTrue : function(value, msg)
  {
    (value === true) ||
      this.__fail(
        msg || "",
        "Called assertTrue with '",
        value,
        "'");
  },


  /**
   * Assert that the value is <code>false</code> (Identity check).
   *
   * @param value {Boolean} Condition to check for. Must be identical to
   *    <code>false</code>.
   * @param msg {String?} Message to be shown if the assertion fails.
   */
  assertFalse : function(value, msg)
  {
    (value === false) ||
      this.__fail(
        msg || "",
        "Called assertFalse with '",
        value,
        "'");
  },


  /**
   * Assert that both values are equal. (Uses the equality operator
   * <code>==</code>.)
   *
   * @param expected {var} Reference value
   * @param found {var} found value
   * @param msg {String?} Message to be shown if the assertion fails.
   */
  assertEquals : function(expected, found, msg)
  {
    expected == found || this.__fail(
      msg || "",
      "Expected '",
      expected,
      "' but found '",
      found,
      "'!");
  },

  /**
   * Assert that both values are not equal. (Uses the not equality operator
   * <code>!=</code>.)
   *
   * @param expected {var} Reference value
   * @param found {var} found value
   * @param msg {String?} Message to be shown if the assertion fails.
   */
  assertNotEquals : function(expected, found, msg)
  {
    expected != found ||
      this.__fail(
        msg || "",
        "Expected '",
        expected,
        "' to be not equal with '",
        found,
        "'!");
  },

  /**
   * Assert that both float values are equal. This might be needed because
   * of the natural floating point inaccuracy of computers.
   *
   * @param expected {Float} Reference value
   * @param found {Float} Found value
   * @param msg {String?} Message to be shown if the assertion fails.
   */
  assertEqualsFloat : function(expected, found, msg)
  {
    let             x = expected;
    let             y = found;

    this.assertNumber(expected);
    this.assertNumber(found);

      // 1e-14 is the relative difference.
    expected === found ||
      Math.abs(x - y) < Number.EPSILON ||
      Math.abs(x - y) <= Math.max(Math.abs(x), Math.abs(y)) * 1e-14 ||
      this.__fail(
        msg || "",
        "Expected '",
        expected,
        "' to be equal with '",
        found,
        "'!");
  },

  /**
   * Assert that both float values are not equal. This might be needed
   * because of the natural floating point inaccuracy of computers.
   *
   * @param expected {Float} Reference value
   * @param found {Float} Found value
   * @param msg {String?} Message to be shown if the assertion fails.
   */
  assertNotEqualsFloat : function(expected, found, msg)
  {
    let             x = expected;
    let             y = found;

    this.assertNumber(expected);
    this.assertNumber(found);

    ! (expected === found ||
       Math.abs(x - y) < Number.EPSILON ||
       Math.abs(x - y) <= Math.max(Math.abs(x), Math.abs(y)) * 1e-14) ||
      this.__fail(
        msg || "",
        "Expected '",
        expected,
        "' to be not equal with '",
        found,
        "'!");
  },

  /**
   * Assert that both values are identical. (Uses the identity operator
   * <code>===</code>.)
   *
   * @param expected {var} Reference value
   * @param found {var} found value
   * @param msg {String?} Message to be shown if the assertion fails.
   */
  assertIdentical : function(expected, found, msg)
  {
    expected === found ||
      this.__fail(
        msg || "",
        "Expected '",
        expected,
        "' (identical) but found '",
        found, "'!");
  },


  /**
   * Assert that both values are not identical. (Uses the not identity operator
   * <code>!==</code>.)
   *
   * @param expected {var} Reference value
   * @param found {var} found value
   * @param msg {String?} Message to be shown if the assertion fails.
   */
  assertNotIdentical : function(expected, found, msg)
  {
    expected !== found ||
      this.__fail(
        msg || "",
        "Expected '",
        expected,
        "' to be not identical with '",
        found,
        "'!");
  },


  /**
   * Assert that the value is not <code>undefined</code>.
   *
   * @param value {var} Value to check
   * @param msg {String?} Message to be shown if the assertion fails.
   */
  assertNotUndefined : function(value, msg)
  {
    value !== undefined ||
      this.__fail(
        msg || "",
        "Expected value not to be undefined but found undefined!");
  },


  /**
   * Assert that the value is <code>undefined</code>.
   *
   * @param value {var} Value to check
   * @param msg {String?} Message to be shown if the assertion fails.
   */
  assertUndefined : function(value, msg)
  {
    value === undefined ||
      this.__fail(
        msg || "",
        "Expected value to be undefined but found ",
        value,
        "!");
  },


  /**
   * Assert that the value is not <code>null</code>.
   *
   * @param value {var} Value to check
   * @param msg {String?} Message to be shown if the assertion fails.
   */
  assertNotNull : function(value, msg)
  {
    value !== null ||
      this.__fail(
        msg || "",
        "Expected value not to be null but found null!");
  },


  /**
   * Assert that the value is <code>null</code>.
   *
   * @param value {var} Value to check
   * @param msg {String?} Message to be shown if the assertion fails.
   */
  assertNull : function(value, msg)
  {
    value === null ||
      this.__fail(
        msg || "",
        "Expected value to be null but found ",
        value,
        "!");
  },


  /**
   * Assert that the first two arguments are equal, when serialized into
   * JSON.
   *
   * @param expected {var} The the expected value
   * @param found {var} The found value
   * @param msg {String?} Message to be shown if the assertion fails.
   */
  assertJsonEquals : function(expected, found, msg) {
    this.assertEquals(
      JSON.stringify(expected),
      JSON.stringify(found),
      msg
    );
  },


  /**
   * Assert that the given string matches the regular expression
   *
   * @param str {String} String, which should match the regular expression
   * @param re {String|RegExp} Regular expression to match
   * @param msg {String?} Message to be shown if the assertion fails.
   */
  assertMatch : function(str, re, msg)
  {
    this.assertString(str);
    this.assert(
      re instanceof RegExp || typeof re == "string",
      "The parameter 're' must be a string or a regular expression."
    );

    str.search(re) >= 0 ||
      this.__fail(
        msg || "",
        "The String '",
        str,
        "' does not match the regular expression '",
        re.toString(), "'!");
  },


  /**
   * Assert that the number of arguments is within the given range
   *
   * @param args {arguments} The <code>arguments<code> variable of a function
   * @param minCount {Integer} Minimal number of arguments
   * @param maxCount {Integer} Maximum number of arguments
   * @param msg {String?} Message to be shown if the assertion fails.
   */
  assertArgumentsCount : function(args, minCount, maxCount, msg)
  {
    var argCount = args.length;

    (argCount >= minCount && argCount <= maxCount) ||
      this.__fail(
        msg || "",
        "Wrong number of arguments given. Expected '",
        minCount,
        "' to '",
        maxCount,
        "' arguments but found '",
        argCount,
        "' arguments."
    );
  },


  /**
   * Asserts that the callback raises a matching exception.
   *
   * @param callback {Function} function to check
   * @param exception {Error?Error} Expected constructor of the exception.
   *   The assertion fails if the raised exception is not an instance of the
   *   parameter.
   * @param re {String|RegExp} The assertion fails if the error message does
   *   not match this parameter
   * @param msg {String?} Message to be shown if the assertion fails.
   */
  assertException : function(callback, exception, re, msg)
  {
    var error;

    exception = exception || Error;

    try
    {
      callback();
    }
    catch(ex)
    {
      error = ex;
    }

    if (error == null)
    {
      this.__fail(msg || "", "The function did not raise an exception!");
    }

    error instanceof exception ||
      this.__fail(
        msg || "",
        "The raised exception does not have the expected type! ",
        exception ,
        " != ",
        error);

    if (re)
    {
      this.assertMatch(error.toString(), re, msg);
    }
  },


  /**
   * Assert that the value is an item in the given array.
   *
   * @param value {var} Value to check
   * @param array {Array} List of valid values
   * @param msg {String?} Message to be shown if the assertion fails.
   */
  assertInArray : function(value, array, msg)
  {
    array.indexOf(value) !== -1 ||
      this.__fail(
        msg || "",
        "The value '",
        value,
        "' must have any of the values defined in the array '",
        array,
        "'"
    );
  },


  /**
   * Assert that the value is NOT an item in the given array
   *
   * @param value {var} Value to check
   * @param array {Array} List of values
   * @param msg {String?} Message to be shown if the assertion fails
   */
  assertNotInArray : function(value, array, msg)
  {
    array.indexOf(value) === -1 ||
      this.__fail(
        msg || "",
        this.__format(
          "The value '%1' must not have any of the values defined in the array '%2'",
          [value, array]
        )
      );
  },


  /**
   * Assert that both array have identical array items.
   *
   * @param expected {Array} The expected array
   * @param found {Array} The found array
   * @param msg {String?} Message to be shown if the assertion fails.
   */
  assertArrayEquals : function(expected, found, msg)
  {
    this.assertArray(expected, msg);
    this.assertArray(found, msg);

    msg = msg ||
      "Expected [" + expected.join(", ") +
      "], but found [" + found.join(", ") + "]";

    if (expected.length !== found.length)
    {
      this.fail(msg, true);
    }

    for (var i = 0; i < expected.length; i++)
    {
      if (expected[i] !== found[i])
      {
        this.fail(msg, true);
      }
    }
  },


  /**
   * Assert that the value is a key in the given map.
   *
   * @param value {var} Value to check
   * @param map {Map} Map, where the keys represent the valid values
   * @param msg {String?} Message to be shown if the assertion fails.
   */
  assertKeyInMap : function(value, map, msg)
  {
    map[value] !== undefined ||
      this.__fail(
        msg || "",
        "The value '",
        value,
        "' must must be a key of the map '",
        map,
        "'"
    );
  },


  /**
   * Assert that the value is a function.
   *
   * @param value {var} Value to check
   * @param msg {String?} Message to be shown if the assertion fails.
   */
  assertFunction : function(value, msg)
  {
    typeof value == "function" ||
      this.__fail(
        msg || "",
        "Expected value to be typeof function but found ",
        value,
        "!");
  },

  /**
   * Assert that the value is a string.
   *
   * @param value {var} Value to check
   * @param msg {String?} Message to be shown if the assertion fails.
   */
  assertString : function(value, msg)
  {
    typeof value == "string" ||
      this.__fail(
        msg || "",
        "Expected value to be a string but found ",
        value,
        "!");
  },


  /**
   * Assert that the value is a boolean.
   *
   * @param value {var} Value to check
   * @param msg {String?} Message to be shown if the assertion fails.
   */
  assertBoolean : function(value, msg)
  {
    typeof value == "boolean" ||
      this.__fail(
        msg || "",
        "Expected value to be a boolean but found ",
        value,
        "!");
  },


  /**
   * Assert that the value is a number.
   *
   * @param value {var} Value to check
   * @param msg {String?} Message to be shown if the assertion fails.
   */
  assertNumber : function(value, msg)
  {
    Number.isFinite(value) ||
      this.__fail(
        msg || "",
        "Expected value to be a number but found ",
        value,
        "!");
  },


  /**
   * Assert that the value is a number >= 0.
   *
   * @param value {var} Value to check
   * @param msg {String?} Message to be shown if the assertion fails.
   */
  assertPositiveNumber : function(value, msg)
  {
    (typeof value == "number" && Number.isFinite(value) && value >= 0) ||
      this.__fail(
        msg || "",
        "Expected value to be a number >= 0 but found ",
        value,
        "!");
  },


  /**
   * Assert that the value is an integer.
   *
   * @param value {var} Value to check
   * @param msg {String?} Message to be shown if the assertion fails.
   */
  assertInteger : function(value, msg)
  {
    Number.isInteger(value) ||
      this.__fail(
        msg || "",
        "Expected value to be an integer but found ",
        value,
        "!");
  },


  /**
   * Assert that the value is an integer >= 0.
   *
   * @param value {var} Value to check
   * @param msg {String?} Message to be shown if the assertion fails.
   */
  assertPositiveInteger : function(value, msg)
  {
    var condition = (
      Number.isInteger(value) &&
      Number.isFinite(value) &&
      value % 1 === 0 &&
      value >= 0);
    
    condition ||
      this.__fail(
        msg || "",
        "Expected value to be an integer >= 0 but found ",
        value,
        "!");
  },


  /**
   * Assert that the value is inside the given range.
   *
   * @param value {var} Value to check
   * @param min {Number} lower bound
   * @param max {Number} upper bound
   * @param msg {String?} Message to be shown if the assertion fails.
   */
  assertInRange : function(value, min, max, msg)
  {
    (value >= min && value <= max) ||
      this.__fail(
        msg || "",
        this.__format(
          "Expected value '%1' to be in the range '%2'..'%3'!",
          [value, min, max]));
  },


  /**
   * Assert that the value is an object.
   *
   * @param value {var} Value to check
   * @param msg {String?} Message to be shown if the assertion fails.
   */
  assertObject : function(value, msg)
  {
    var condition =
      value !== null &&
      typeof value === "object";

    condition ||
      this.__fail(
        msg || "",
        "Expected value to be typeof object but found ",
        (value),
        "!");
  },


  /**
   * Assert that the value is an array.
   *
   * @param value {var} Value to check
   * @param msg {String?} Message to be shown if the assertion fails.
   */
  assertArray : function(value, msg)
  {
    Array.isArray(value) ||
      this.__fail(
        msg || "",
        "Expected value to be an array but found ",
        value,
        "!");
  },


  /**
   * Assert that the value is a map either created using <code>new Object</code>
   * or by using the object literal notation <code>{ ... }</code>.
   *
   * @param value {var} Value to check
   * @param msg {String?} Message to be shown if the assertion fails.
   */
  assertMap : function(value, msg)
  {
    (value !== null && typeof value == "object") ||
      this.__fail(
        msg || "",
        "Expected value to be a map but found ",
        value,
        "!");
  },


  /**
  * Assert that the value is a regular expression.
  *
  * @param value {var} Value to check
  * @param msg {String?} Message to be shown if the assertion fails.
  */
 assertRegExp : function(value, msg)
 {
   value instanceof RegExp ||
     this.__fail(
       msg || "",
       "Expected value to be a regular expression but found ",
       value,
       "!");
 },


  /**
   * Assert that the value has the given type using the <code>typeof</code>
   * operator. Because the type is not always what it is supposed to be it is
   * better to use more explicit checks like {@link #assertString} or
   * {@link #assertArray}.
   *
   * @param value {var} Value to check
   * @param type {String} expected type of the value
   * @param msg {String?} Message to be shown if the assertion fails.
   */
  assertType : function(value, type, msg)
  {
    this.assertString(type, "Invalid argument 'type'");

    typeof(value) === type ||
      this.__fail(
        msg || "",
        "Expected value to be typeof '",
        type,
        "' but found ",
        value,
        "!");
  },


  /**
   * Assert that the value is an instance of the given class.
   *
   * @param value {var} Value to check
   * @param clazz {Class} The value must be an instance of this class
   * @param msg {String?} Message to be shown if the assertion fails.
   */
  assertInstance : function(value, clazz, msg)
  {
    var className = clazz.classname || clazz + "";

    value instanceof clazz ||
      this.__fail(
        msg || "",
        "Expected value to be instanceof '",
        className,
        "' but found ",
        value,
        "!");
  }
};
