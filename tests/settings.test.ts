import { describe, it } from 'node:test';
import assert from 'node:assert';
import { DEFAULT_SETTINGS } from '../src/utils/storage.ts';
import { translations } from '../src/utils/i18n.ts';

describe('UserSettings Defaults', () => {
  it('has select-to-action defaults enabled and configured', () => {
    assert.strictEqual(DEFAULT_SETTINGS.selectToActionEnabled, true);
    assert.strictEqual(DEFAULT_SETTINGS.selectTriggerMode, 'modifier');
    assert.strictEqual(DEFAULT_SETTINGS.selectModifierKey, 'alt');
    assert.strictEqual(DEFAULT_SETTINGS.defaultSelectionActionId, 'translate');
  });
});

describe('i18n Parity for Selection Features', () => {
  const languages = ['vi', 'en', 'ja'] as const;

  it('has translation keys for Select-to-Action across all languages', () => {
    const requiredKeys = [
      'selectToActionTitle',
      'enableSelectToAction',
      'enableSelectToActionDesc',
      'selectTriggerModeLabel',
      'selectTriggerModeAlways',
      'selectTriggerModeModifier',
      'selectModifierKeyLabel',
      'defaultSelectionActionLabel',
      'defaultSelectionActionDesc',
      'modifierKeyAlt',
      'modifierKeyCtrl',
      'modifierKeyShift',
    ] as const;

    for (const lang of languages) {
      const dict = translations[lang] as Record<string, any>;
      for (const key of requiredKeys) {
        assert.ok(dict[key], `Missing translation key "${key}" for language "${lang}"`);
      }
    }
  });
});
