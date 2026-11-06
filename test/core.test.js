import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseConnectionHeader,
  isHopByHop,
  hasCloseDirective,
} from '../src/index.js';

test('parses a simple list of hop-by-hop tokens', () => {
  const result = parseConnectionHeader('keep-alive, Upgrade');
  assert.deepEqual(result.tokens, ['keep-alive', 'Upgrade']);
  assert.equal(result.close, false);
});

test('detects the close directive case-insensitively', () => {
  const result = parseConnectionHeader('Keep-Alive, CLOSE');
  assert.deepEqual(result.tokens, ['Keep-Alive', 'CLOSE']);
  assert.equal(result.close, true);
});

test('drops empty tokens from stray commas and whitespace', () => {
  const result = parseConnectionHeader(' , keep-alive , , , Upgrade , ');
  assert.deepEqual(result.tokens, ['keep-alive', 'Upgrade']);
  assert.equal(result.close, false);
});

test('handles an empty header value', () => {
  const result = parseConnectionHeader('');
  assert.deepEqual(result.tokens, []);
  assert.equal(result.close, false);
});

test('handles a header value that is only commas and spaces', () => {
  const result = parseConnectionHeader(' , , ');
  assert.deepEqual(result.tokens, []);
  assert.equal(result.close, false);
});

test('isHopByHop matches tokens case-insensitively', () => {
  assert.equal(isHopByHop('upgrade', 'keep-alive, Upgrade'), true);
  assert.equal(isHopByHop('UPGRADE', 'keep-alive, Upgrade'), true);
  assert.equal(isHopByHop('keep-alive', 'keep-alive, Upgrade'), true);
  assert.equal(isHopByHop('close', 'keep-alive, Upgrade'), false);
  assert.equal(isHopByHop('te', 'keep-alive, Upgrade'), false);
});

test('isHopByHop treats close as a directive, not a hop-by-hop header', () => {
  assert.equal(isHopByHop('close', 'close'), false);
  assert.equal(isHopByHop('Close', 'Close'), false);
  assert.equal(isHopByHop('close', 'keep-alive, close'), false);
});

test('hasCloseDirective detects close in any position and case', () => {
  assert.equal(hasCloseDirective('close'), true);
  assert.equal(hasCloseDirective('Close'), true);
  assert.equal(hasCloseDirective('keep-alive, close'), true);
  assert.equal(hasCloseDirective('keep-alive, CLOSE, Upgrade'), true);
  assert.equal(hasCloseDirective('keep-alive, Upgrade'), false);
  assert.equal(hasCloseDirective(''), false);
});

test('rejects non-string input to parseConnectionHeader', () => {
  assert.throws(() => parseConnectionHeader(null), TypeError);
  assert.throws(() => parseConnectionHeader(undefined), TypeError);
  assert.throws(() => parseConnectionHeader(42), TypeError);
});

test('rejects non-string token to isHopByHop', () => {
  assert.throws(() => isHopByHop(null, 'keep-alive'), TypeError);
});

test('preserves original casing of tokens in the result', () => {
  const result = parseConnectionHeader('Keep-Alive, Upgrade');
  assert.deepEqual(result.tokens, ['Keep-Alive', 'Upgrade']);
});

test('does not treat a token containing close as the close directive', () => {
  const result = parseConnectionHeader('close-foo, close');
  assert.deepEqual(result.tokens, ['close-foo', 'close']);
  assert.equal(result.close, true);
  assert.equal(isHopByHop('close-foo', 'close-foo, close'), true);
});
