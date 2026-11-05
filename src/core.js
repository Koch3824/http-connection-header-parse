/**
 * Parses the HTTP Connection header value into a list of hop-by-hop tokens
 * and close directives.
 *
 * The Connection header is a comma-separated list of tokens. Per RFC 7230,
 * each token is a case-insensitive field name. The token "close" is a
 * special directive indicating the connection should be closed after the
 * response; it is not a hop-by-hop header name. We choose to keep the
 * tokens in their original case and also return a lowercased set for
 * case-insensitive matching. This is the single interpretation we support:
 * the returned object has `tokens` (array of trimmed non-empty strings as
 * they appeared) and `close` (boolean true if any token equals "close"
 * case-insensitively). Empty tokens from stray commas are dropped.
 *
 * @param {string} value - the raw Connection header value.
 * @returns {{ tokens: string[], close: boolean }}
 */
export function parseConnectionHeader(value) {
  if (typeof value !== 'string') {
    throw new TypeError('Connection header value must be a string');
  }

  const tokens = [];
  let close = false;

  // Split on commas, trim each part, drop empties. We do not attempt to
  // parse quoted strings because field names cannot be quoted per RFC 7230.
  for (const part of value.split(',')) {
    const token = part.trim();
    if (token.length === 0) {
      continue;
    }
    tokens.push(token);
    if (token.toLowerCase() === 'close') {
      close = true;
    }
  }

  return { tokens, close };
}

/**
 * Returns true if the given token is a hop-by-hop header name according to
 * the Connection header value. The special "close" directive is *not*
 * considered a hop-by-hop header name, because it is not a header field.
 * Matching is case-insensitive per RFC 7230.
 *
 * @param {string} token - the token to test.
 * @param {string} connectionValue - the raw Connection header value.
 * @returns {boolean}
 */
export function isHopByHop(token, connectionValue) {
  if (typeof token !== 'string') {
    throw new TypeError('token must be a string');
  }
  const { tokens } = parseConnectionHeader(connectionValue);
  const lower = token.toLowerCase();
  if (lower === 'close') {
    return false;
  }
  return tokens.some((t) => t.toLowerCase() === lower);
}

/**
 * Returns true if the Connection header value contains the "close"
 * directive (case-insensitive).
 *
 * @param {string} connectionValue - the raw Connection header value.
 * @returns {boolean}
 */
export function hasCloseDirective(connectionValue) {
  return parseConnectionHeader(connectionValue).close;
}
