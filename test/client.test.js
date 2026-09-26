/**
 * Discovery contract tests for the stats-footer hash discovery.
 *
 * The separator rule's MARGIN drifted between host releases
 * (dsh 0.1.1: `margin: 0 10px`, dsh 0.1.5-rc.3: `margin: 0 6px`) and the
 * 0.1.0 discovery required the exact 0.1.1 margin, so on 0.1.5 the hash was
 * never found and the footer stayed clamped (2026-09-26). Discovery must
 * gate on the separator COLOR plus the sibling `_root` width clamp only —
 * never on margin values.
 *
 * Runs the real client.js in a stubbed browser environment (no dependencies).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const CLIENT_PATH = new URL('../client.js', import.meta.url);
const SOURCE = readFileSync(CLIENT_PATH, 'utf8');

const SEPARATOR_COLOR = 'var(--dsw-alias-separator-primary)';

/** A minimal CSSStyleRule-shaped object. */
function rule(selectorText, style) {
  return { type: 1, selectorText, style };
}

/** A stylesheet whose cssRules are readable. */
function sheet(rules) {
  return { cssRules: rules };
}

/** A stylesheet whose cssRules throw (cross-origin). */
function unreadableSheet() {
  return {
    get cssRules() {
      throw new Error('SecurityError');
    },
  };
}

/**
 * Evaluate client.js against fresh browser stubs and return
 * { apply, inject, state } with apply() already wired to a no-op ctx.effect.
 */
function loadClient(styleSheets) {
  let definition = null;
  const fakeWindow = {
    __ModuleLoader__: { load(def) { definition = def; } },
  };
  const fakeStyle = {
    dataset: {},
    textContent: '',
    style: {},
    remove() {},
  };
  const fakeDocument = {
    styleSheets,
    head: { append(el) { fakeDocument.installedStyle = el; } },
    body: null,
    createElement() { return { ...fakeStyle, style: {} }; },
    installedStyle: null,
  };
  const fakeConsole = { info() {} };
  class FakeMutationObserver {
    observe() {}
    disconnect() {}
  }
  const raf = (fn) => fn();

  const evaluate = new Function(
    'window', 'document', 'console', 'MutationObserver', 'requestAnimationFrame',
    SOURCE,
  );
  evaluate(fakeWindow, fakeDocument, fakeConsole, FakeMutationObserver, raf);

  assert.ok(definition, 'module loader received the definition');
  assert.strictEqual(definition.id, 'dsh-wide-stats-footer');
  const exports = definition.factory(() => ({}));
  assert.strictEqual(exports.inject[0], 'slots');

  const ctx = { effect(fn) { return fn(); } };
  exports.apply(ctx);

  return {
    state: fakeWindow.__WIDE_STATS_FOOTER__,
    installedStyle: fakeDocument.installedStyle,
  };
}

test('discovers the hash from the dsh 0.1.5 separator shape (margin 0 6px)', () => {
  const { state, installedStyle } = loadClient([
    sheet([
      rule('.bOPqQW_sep', { margin: '0px 6px', color: SEPARATOR_COLOR }),
      rule('.bOPqQW_root', { maxWidth: 'var(--dsh-chat-content-width)' }),
    ]),
  ]);
  assert.strictEqual(state.styleHash, 'bOPqQW');
  assert.ok(installedStyle.textContent.includes('.bOPqQW_root.bOPqQW_root'), 'override rule injected');
  assert.strictEqual(state.overrideChars, installedStyle.textContent.length);
});

test('still discovers the dsh 0.1.1 separator shape (margin 0 10px)', () => {
  const { state } = loadClient([
    sheet([
      rule('.aB12xY_sep', { margin: '0px 10px', color: SEPARATOR_COLOR }),
      rule('.aB12xY_root', { maxWidth: 'var(--dsh-chat-content-width)' }),
    ]),
  ]);
  assert.strictEqual(state.styleHash, 'aB12xY');
});

test('discovers through adjacent unreadable (cross-origin) sheets', () => {
  const { state } = loadClient([
    unreadableSheet(),
    sheet([
      rule('.cD34zW_sep', { margin: '0px 6px', color: SEPARATOR_COLOR }),
      rule('.cD34zW_root', { maxWidth: 'var(--dsh-chat-content-width)' }),
    ]),
    unreadableSheet(),
  ]);
  assert.strictEqual(state.styleHash, 'cD34zW');
});

test('rejects a separator whose color is not the stats-line separator color', () => {
  const { state, installedStyle } = loadClient([
    sheet([
      rule('.eF56uv_sep', { margin: '0px 6px', color: 'var(--dsw-alias-border-l1)' }),
      rule('.eF56uv_root', { maxWidth: 'var(--dsh-chat-content-width)' }),
    ]),
  ]);
  assert.strictEqual(state.styleHash, null);
  assert.strictEqual(installedStyle.textContent, '');
});

test('rejects a separator color match when the sibling root has no width clamp', () => {
  const { state, installedStyle } = loadClient([
    sheet([
      rule('.gH78wx_sep', { margin: '0px 6px', color: SEPARATOR_COLOR }),
      rule('.gH78wx_root', { maxWidth: 'none' }),
    ]),
  ]);
  assert.strictEqual(state.styleHash, null);
  assert.strictEqual(installedStyle.textContent, '');
});
