import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compile, generate } from '../src/generator.js';
import { loadSettings, saveSettings } from '../src/files.js';

const fixed = value => () => value;
const rows = [{ name: 'V', value: 'a/i/u' }, { name: 'C', value: 'p/t' }];
test('choices, subpatterns, nesting and optional groups', () => {
  const p = compile('C[V/VV](s)', rows);
  assert.equal(p.render(fixed(0)), 'pa');
  assert.equal(p.render(fixed(0.99)), 'tuus');
  assert.equal(p.possibilities, 48);
});
test('weights, trailing empty options, quoted syntax and spaces', () => {
  assert.equal(compile('a/b*3', []).render(fixed(0.3)), 'b');
  assert.equal(compile('[a/]', []).render(fixed(0.99)), '');
  assert.equal(compile('heh"[mY/worD)]"', []).render(fixed(0)), 'heh[mY/worD)]');
  assert.equal(compile('a b" c"', []).render(fixed(0)), 'ab c');
});
test('filters reject attempts and duplicates are not retried', () => {
  const p = compile('[VV]^aa^ii^uu', rows);
  assert.equal(p.render(fixed(0)), null);
  assert.deepEqual(generate(p, 3, true, fixed(0)), { words: [], filtered: 3, duplicates: 0 });
  assert.deepEqual(generate(compile('a', []), 3, true, fixed(0)), { words: ['a'], filtered: 0, duplicates: 2 });
});
test('cycles and malformed brackets are rejected; missing references warn', () => {
  assert.throws(() => compile('A', [{ name: 'A', value: 'B' }, { name: 'B', value: 'A' }]), /Cyclic/);
  assert.throws(() => compile('[a)', []), /unmatched/);
  const p = compile('Z', []); assert.match(p.warnings[0], /Undefined/); assert.equal(p.render(), '');
});
test('Awkwords settings round trip', () => {
  const settings = { rows, pattern: 'CV(CV)', count: 42, newline: true, unique: true };
  assert.deepEqual(loadSettings(new TextEncoder().encode(saveSettings(settings))), settings);
  assert.throws(() => loadSettings(new TextEncoder().encode('#awkwords version 1.2\nr:a\n')), /Invalid/);
});
