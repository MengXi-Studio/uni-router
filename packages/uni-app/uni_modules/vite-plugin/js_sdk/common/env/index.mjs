function h(r,o){const s={},c=r.split(`
`);for(const f of c){const i=f.trim();if(!i||i.startsWith("#"))continue;const n=i.indexOf("=");if(n===-1)continue;const e=i.slice(0,n).trim();let t=i.slice(n+1).trim();(t.startsWith('"')&&t.endsWith('"')||t.startsWith("'")&&t.endsWith("'"))&&(t=t.slice(1,-1)),o?.prefix?e.startsWith(o.prefix)&&(s[e]=t):s[e]=t}return s}export{h as parseEnvContent};
