import { describe, it } from 'node:test';
import assert from 'node:assert';
import { normalizeDomain, isDomainDisabled } from '../src/utils/storage.ts';

describe('normalizeDomain', () => {
  it('strips https:// and trailing paths', () => {
    assert.strictEqual(normalizeDomain('https://youtube.com/watch?v=123'), 'youtube.com');
  });

  it('strips http:// and www.', () => {
    assert.strictEqual(normalizeDomain('http://www.google.com/'), 'google.com');
    assert.strictEqual(normalizeDomain('www.facebook.com'), 'facebook.com');
  });

  it('strips ports and query params', () => {
    assert.strictEqual(normalizeDomain('http://localhost:3000/test?foo=bar#hash'), 'localhost');
    assert.strictEqual(normalizeDomain('sub.example.com:8080'), 'sub.example.com');
  });

  it('handles empty or whitespace strings', () => {
    assert.strictEqual(normalizeDomain(''), '');
    assert.strictEqual(normalizeDomain('   '), '');
  });

  it('converts to lowercase', () => {
    assert.strictEqual(normalizeDomain('HTTPS://WWW.GITHUB.COM/TEST'), 'github.com');
  });
});

describe('isDomainDisabled', () => {
  const disabledList = ['youtube.com', 'google.com', 'docs.github.com'];

  it('matches exact domain', () => {
    assert.strictEqual(isDomainDisabled('youtube.com', disabledList), true);
    assert.strictEqual(isDomainDisabled('www.youtube.com', disabledList), true);
  });

  it('matches subdomains for apex domain', () => {
    assert.strictEqual(isDomainDisabled('mail.google.com', disabledList), true);
    assert.strictEqual(isDomainDisabled('docs.google.com', disabledList), true);
    assert.strictEqual(isDomainDisabled('deep.sub.google.com', disabledList), true);
  });

  it('matches specific subdomain without disabling parent or siblings', () => {
    assert.strictEqual(isDomainDisabled('docs.github.com', disabledList), true);
    assert.strictEqual(isDomainDisabled('sub.docs.github.com', disabledList), true);
    // github.com is NOT disabled
    assert.strictEqual(isDomainDisabled('github.com', disabledList), false);
    // gist.github.com is NOT disabled
    assert.strictEqual(isDomainDisabled('gist.github.com', disabledList), false);
  });

  it('returns false for unrelated domains', () => {
    assert.strictEqual(isDomainDisabled('notyoutube.com', disabledList), false);
    assert.strictEqual(isDomainDisabled('google.com.vn', disabledList), false);
    assert.strictEqual(isDomainDisabled('twitter.com', disabledList), false);
  });

  it('handles empty or undefined inputs', () => {
    assert.strictEqual(isDomainDisabled('', disabledList), false);
    assert.strictEqual(isDomainDisabled('google.com', []), false);
    assert.strictEqual(isDomainDisabled('google.com', undefined), false);
    assert.strictEqual(isDomainDisabled('google.com', {} as any), false);
  });

  it('does not allow single words or TLDs to match all subdomains', () => {
    assert.strictEqual(isDomainDisabled('google.com', ['com']), false);
    assert.strictEqual(isDomainDisabled('vnexpress.net', ['net']), false);
    assert.strictEqual(isDomainDisabled('localhost', ['localhost']), true);
  });

  it('handles leading and trailing dots gracefully', () => {
    assert.strictEqual(normalizeDomain('.google.com.'), 'google.com');
    assert.strictEqual(isDomainDisabled('docs.google.com', ['.google.com']), true);
  });
});
