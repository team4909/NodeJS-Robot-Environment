/**
 * RPC Errors
 */
var ErrorCode =
  {
    /**
     * Parse Error
     *
     * Invalid JSON was received by the server.
     * An error occurred on the server while parsing the JSON text.
     */
    ParseError     : -32700,

    /**
     * Invalid Request
     *
     * The JSON received by the server is not a valid Request object.
     */
    InvalidRequest : -32600,

    /**
     * Method Not Found
     *
     * The method specified in the request is not found in the requested
     * service.
     */
    MethodNotFound : -32601,

    /**
     * Invalid method parameter(s)
     *
     * If a method discovers that the parameters (arguments) provided to
     * it do not match the requisite types for the method's parameters,
     * it should return this error code to indicate so to the caller.
     */
    InvalidParams  : -32602,

    /**
     * Internal JSON-RPC error
     */
    InternalError  : -32603,

    /*********************************************************************
     * The values -32099 to -32000 are reserved for implementation-defined
     * server errors. RPC-specific error codes must be outside of this
     * range, and should generally be positive values.
     *********************************************************************/

    /**
     * Permission Denied
     *
     * A JSON-RPC service provider can require authentication, and that
     * authentication can be implemented such the method takes
     * authentication parameters, or such that a method or class of
     * methods requires prior authentication.  If the caller has not
     * properly authenticated to use the requested method, this error
     * code is returned.
     */
    PermissionDenied  : -32000
  };

module.exports = ErrorCode;
