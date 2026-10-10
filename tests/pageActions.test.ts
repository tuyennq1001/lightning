import { describe, it } from 'node:test';
import assert from 'node:assert';
import { sanitizePageActions, DEFAULT_PAGE_ACTIONS, type CustomAction } from '../src/utils/storage.ts';

describe('sanitizePageActions', () => {
  it('returns default page actions when input is empty or undefined', () => {
    const result = sanitizePageActions([]);
    assert.strictEqual(result.length, DEFAULT_PAGE_ACTIONS.length);
    assert.deepStrictEqual(result.map(a => a.id), ['summarize-page', 'simplify-page']);
  });

  it('filters out obsolete summarize-youtube action from stored actions', () => {
    const legacyActions: CustomAction[] = [
      {
        id: 'summarize-page',
        label: 'Tóm tắt trang này',
        icon: '📄',
        prompt: 'test',
        scene: 'reading',
        isDefault: true,
        shortcut: 'Alt+O',
      },
      {
        id: 'simplify-page',
        label: 'Đơn giản hóa (ELI5)',
        icon: '🧒',
        prompt: 'test',
        scene: 'reading',
        isDefault: true,
        shortcut: 'Alt+P',
      },
      {
        id: 'summarize-youtube',
        label: 'Tóm tắt video YouTube',
        icon: '⚡',
        prompt: 'test youtube',
        scene: 'reading',
        isDefault: true,
        shortcut: 'Alt+Y',
      },
    ];

    const result = sanitizePageActions(legacyActions);
    assert.strictEqual(result.some(a => a.id === 'summarize-youtube'), false);
    assert.strictEqual(result.length, 2);
    assert.deepStrictEqual(result.map(a => a.id), ['summarize-page', 'simplify-page']);
  });

  it('preserves valid custom page actions while filtering out youtube actions', () => {
    const mixedActions: CustomAction[] = [
      {
        id: 'summarize-page',
        label: 'Tóm tắt trang này',
        icon: '📄',
        prompt: 'test',
        scene: 'reading',
        isDefault: true,
        shortcut: 'Alt+O',
      },
      {
        id: 'my-custom-action',
        label: 'Custom Analysis',
        icon: '🔍',
        prompt: 'custom prompt',
        scene: 'reading',
        isDefault: false,
        shortcut: 'Alt+C',
      },
      {
        id: 'summarize-youtube',
        label: 'Tóm tắt video YouTube',
        icon: '⚡',
        prompt: 'test youtube',
        scene: 'reading',
        isDefault: true,
        shortcut: 'Alt+Y',
      },
    ];

    const result = sanitizePageActions(mixedActions);
    assert.strictEqual(result.some(a => a.id === 'summarize-youtube'), false);
    assert.strictEqual(result.some(a => a.id === 'my-custom-action'), true);
    // Also ensures default simplify-page is backfilled if missing
    assert.strictEqual(result.some(a => a.id === 'simplify-page'), true);
  });
});
