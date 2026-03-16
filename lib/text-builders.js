function joinList(arr) {
  return Array.isArray(arr) && arr.length ? arr.join('、') : '';
}

function buildProductText(p) {
  return [
    p.name || '',
    `風味：${joinList(p.meta?.sensory?.aroma)}${p.meta?.sensory?.taste ? `，口感：${joinList(p.meta?.sensory?.taste)}` : ''}`,
    `情境：${joinList(p.meta?.occasion?.settings)}`,
    `類型：${joinList(p.types)}`,
    `酒造：${joinList(p.brewery)}`,
  ].filter(Boolean).join('。');
}

function buildArticleText(a) {
  return [
    a.title || '',
    `摘要：${a.summary || ''}`,
    `標籤：${joinList(a.tagBlock?.keywords)}`,
    `洞察：${joinList(a.keyInsights)}`,
  ].filter(Boolean).join('。');
}

module.exports = {
  buildProductText,
  buildArticleText,
};
