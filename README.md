# http-connection-header-parse

Parses the HTTP `Connection` header value into a list of hop-by-hop tokens and a `close` directive flag.

```js
import {
  parseConnectionHeader,
  isHopByHop,
  hasCloseDirective,
} from './src/index.js';

const result = parseConnectionHeader('keep-alive, Upgrade, close');
// result.tokens -> ['keep-alive', 'Upgrade', 'close']
// result.close  -> true

isHopByHop('upgrade', 'keep-alive, Upgrade'); // true
isHopByHop('close', 'keep-alive, Upgrade, close'); // false
hasCloseDirective('Keep-Alive, CLOSE'); // true
```

## Why this exists

The `Connection` header mixes two different things in one comma-separated list: names of hop-by-hop header fields (like `Upgrade` or `TE`) and the `close` directive. Code that forwards a request must strip hop-by-hop headers before sending it onward, but must not strip the `close` directive as if it were a field name. This library keeps the two concerns separate: `tokens` are the raw, trimmed, non-empty entries in order, and `close` is a boolean that is true only when a token equals `close` case-insensitively. The trade-off is that we do not parse quoted strings or validate token syntax; field names cannot be quoted in this header, and rejecting malformed input would make the parser less useful for tolerant proxies.

## The awkward edge

An empty token from a stray comma is dropped, and the original casing of each token is preserved. That means `parseConnectionHeader('Keep-Alive, , close')` returns `{ tokens: ['Keep-Alive', 'close'], close: true }` — the empty entry disappears, but the spelling of `Keep-Alive` is untouched. `isHopByHop` uses case-insensitive comparison, and it deliberately returns `false` for `close` because `close` is a directive, not a header field name.
