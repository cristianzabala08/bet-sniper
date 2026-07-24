module.exports = function stripImportAttributesLoader(source) {
  return source.replace(/(\bimport\s[^;\n]*?)\s+(?:with|assert)\s*\{[^}]*\}/g, '$1');
};
