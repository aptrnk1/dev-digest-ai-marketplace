// The only way components get UI strings: every string lives in src/i18n/uk.json (AC90).
import dict from '../i18n-data.js';

const pluralRules = new Intl.PluralRules('uk');

export function t(key, params = {}) {
  let value = dict[key];
  if (value === undefined) {
    console.error(`unknown i18n key "${key}"`);
    return key;
  }
  if (typeof value === 'object') value = value[pluralRules.select(params.count ?? 0)] ?? value.other;
  return String(value).replace(/\{(\w+)\}/g, (m, name) => (params[name] !== undefined ? String(params[name]) : m));
}
