import{randomBytes as n}from"crypto";function a(e=8){const t=Math.max(1,Math.min(64,e));return n(Math.ceil(t/2)).toString("hex").slice(0,t)}export{a as generateRandomHash};
