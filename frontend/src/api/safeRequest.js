const GENERIC_ERROR = "Something went wrong. Please try again.";
const CONNECTION_ERROR = "Couldn't connect. Check your connection and try again.";

/** Fetch and decode a JSON API response without surfacing transport, parse,
 * or server exception details to the UI. Known 4xx validation messages remain
 * available for normal user-correctable errors. */
export async function safeRequestJson(url, options, fallbackMessage) {
  let response;
  try {
    response = await fetch(url, options);
  } catch {
    throw new Error(CONNECTION_ERROR);
  }

  let data = {};
  try {
    data = await response.json();
  } catch {
    // A proxy or server may return an empty/non-JSON response.
  }

  if (!response.ok) {
    const message = response.status >= 500
      ? GENERIC_ERROR
      : typeof data?.error === "string"
        ? data.error
        : fallbackMessage;
    throw new Error(message);
  }

  return data;
}
