function joinList(arr, separator = ', ') {
  return Array.isArray(arr) && arr.length ? arr.join(separator) : '';
}

function buildProductText(p) {
  return [
    p.name || '',
    `風味：${joinList(p.meta?.sensory?.aroma, '、')}${p.meta?.sensory?.taste ? `，口感：${joinList(p.meta?.sensory?.taste, '、')}` : ''}`,
    `情境：${joinList(p.meta?.occasion?.settings, '、')}`,
    `類型：${joinList(p.types, '、')}`,
    `酒造：${joinList(p.brewery, '、')}`,
  ].filter(Boolean).join('。');
}

function buildArticleText(a) {
  return [
    a.title || '',
    `摘要：${a.summary || ''}`,
    `標籤：${joinList(a.tagBlock?.keywords, '、')}`,
    `洞察：${joinList(a.keyInsights, '、')}`,
  ].filter(Boolean).join('。');
}

/**
 * Generic profile-to-text builder.
 * Accepts a fieldMap to define which profile keys map to which labels.
 * Default fieldMap is intentionally neutral — no domain-specific labels.
 *
 * @param {Object} profile - user preference object
 * @param {Object} [fieldMap] - { profileKey: label } mapping
 * @returns {string} concatenated text for embedding query
 *
 * @example
 *   // Generic usage
 *   profileToText({ style: 'bold', budget: 'medium' })
 *
 *   // Domain-specific (in your PRIVATE adapter, not this repo)
 *   profileToText(profile, { sweetness: '甘口偏好', body: '酒體' })
 */
const DEFAULT_FIELD_MAP = {
  style: 'style preference',
  body: 'body',
  occasion: 'occasion',
  budget: 'budget',
  flavorNotes: 'preferred flavors',
  avoidNotes: 'disliked flavors',
};

function profileToText(profile = {}, fieldMap = DEFAULT_FIELD_MAP) {
  const parts = [];
  for (const [key, label] of Object.entries(fieldMap)) {
    const val = profile[key];
    if (!val) continue;
    if (Array.isArray(val) && val.length) {
      parts.push(`${label}: ${val.join(', ')}`);
    } else if (typeof val === 'string' && val.trim()) {
      parts.push(`${label}: ${val}`);
    }
  }
  // Also include any extra keys not in fieldMap, so nothing is silently dropped
  for (const [key, val] of Object.entries(profile)) {
    if (fieldMap[key]) continue;
    if (!val) continue;
    if (Array.isArray(val) && val.length) {
      parts.push(`${key}: ${val.join(', ')}`);
    } else if (typeof val === 'string' && val.trim()) {
      parts.push(`${key}: ${val}`);
    }
  }
  return parts.join('. ');
}

module.exports = {
  buildProductText,
  buildArticleText,
  profileToText,
  DEFAULT_FIELD_MAP,
};
