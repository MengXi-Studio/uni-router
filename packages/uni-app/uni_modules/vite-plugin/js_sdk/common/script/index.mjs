function o(c,e="callback",r=""){return c?`function(${r}) { try { ${c} } catch(e) { console.error('[${e}] error:', e); } }`:`function(${r}) {}`}export{o as makeCallback};
