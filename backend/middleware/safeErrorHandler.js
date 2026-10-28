const GENERIC_ERROR = "Something went wrong. Please try again.";

/**
 * Final Express error handler. Diagnostic details stay in server logs;
 * responses never include exception messages, stacks, parser input, or
 * dependency/provider error text.
 */
export function safeErrorHandler(err, req, res, next) {
  if (res.headersSent) {
    // A response has already started, so Express must close/delegate it.
    return next(err);
  }

  const status = err?.status ?? err?.statusCode;
  const isMalformedJson = err?.type === "entity.parse.failed";
  const isOversizedBody = err?.type === "entity.too.large" || status === 413;
  const safeStatus = isMalformedJson ? 400 : isOversizedBody ? 413 : 500;
  const safeMessage = isMalformedJson
    ? "Invalid JSON request."
    : isOversizedBody
      ? "Request body is too large."
      : GENERIC_ERROR;

  // Do not log the raw error object: parser errors may carry the request body,
  // and provider/database errors may contain sensitive upstream details.
  req.log?.error({
    requestId: req.id,
    method: req.method,
    path: req.path,
    status: safeStatus,
    errorName: typeof err?.name === "string" ? err.name : "Error",
    errorType: typeof err?.type === "string" ? err.type : undefined,
  }, "Request failed");

  return res.status(safeStatus).json({ error: safeMessage });
}
