import{createPluginFactory as c,BasePlugin as F}from"../../../factory/index.mjs";import{parseEnvContent as A}from"../../../common/env/index.mjs";import{formatDate as E}from"../../../common/format/index.mjs";import{injectBeforeTag as C}from"../../../common/html/index.mjs";import{writeFileContent as g}from"../../../common/fs/index.mjs";import m from"node:path";import p from"node:fs";import"../../../logger/index.mjs";import"../../../shared/vite-plugin.DcExl6jd.mjs";import"../../../common/object/index.mjs";import"../../../shared/vite-plugin.CuXEJAWX.mjs";import"fs";import"path";import"../../../common/concurrency/index.mjs";const D=new Set(["string","url","path","enum","semver",void 0]);function y(t,u){switch(u.type){case"number":{if(isNaN(Number(t))||t.trim()==="")return{valid:!1,status:"type_error",message:`\u73AF\u5883\u53D8\u91CF\u503C "${t}" \u4E0D\u662F\u5408\u6CD5\u6570\u5B57`};break}case"url":{try{new URL(t)}catch{return{valid:!1,status:"type_error",message:`\u73AF\u5883\u53D8\u91CF\u503C "${t}" \u4E0D\u662F\u5408\u6CD5 URL`}}break}case"boolean":{const r=t.toLowerCase();if(!["true","false","1","0","yes","no"].includes(r))return{valid:!1,status:"type_error",message:`\u73AF\u5883\u53D8\u91CF\u503C "${t}" \u4E0D\u662F\u5408\u6CD5\u5E03\u5C14\u503C (true/false/1/0/yes/no)`};break}case"enum":{if(!u.enumValues||u.enumValues.length===0)return{valid:!1,status:"enum_mismatch",message:"enum \u7C7B\u578B\u5FC5\u987B\u6307\u5B9A enumValues"};if(!u.enumValues.includes(t))return{valid:!1,status:"enum_mismatch",message:`\u73AF\u5883\u53D8\u91CF\u503C "${t}" \u4E0D\u5728\u5141\u8BB8\u7684\u679A\u4E3E\u503C\u4E2D: ${u.enumValues.join(", ")}`};break}case"json":{try{JSON.parse(t)}catch{return{valid:!1,status:"type_error",message:"\u73AF\u5883\u53D8\u91CF\u503C\u4E0D\u662F\u5408\u6CD5 JSON"}}break}case"semver":{if(!/^\d+\.\d+\.\d+(-[\w.]+)?(\+[\w.]+)?$/.test(t))return{valid:!1,status:"type_error",message:`\u73AF\u5883\u53D8\u91CF\u503C "${t}" \u4E0D\u662F\u5408\u6CD5\u8BED\u4E49\u5316\u7248\u672C\u53F7 (x.y.z)`};break}case"path":{if(!/^(?:[./\\]|(?:[a-zA-Z]:))/.test(t))return{valid:!1,status:"type_error",message:`\u73AF\u5883\u53D8\u91CF\u503C "${t}" \u4E0D\u662F\u5408\u6CD5\u6587\u4EF6\u8DEF\u5F84`};break}}return{valid:!0,status:"pass",message:""}}function $(t,u){if(u.type!=="number")return{valid:!0,status:"pass",message:""};const r=Number(t);return u.minValue!==void 0&&r<u.minValue?{valid:!1,status:"range_error",message:`\u6570\u503C ${r} \u5C0F\u4E8E\u6700\u5C0F\u503C ${u.minValue}`}:u.maxValue!==void 0&&r>u.maxValue?{valid:!1,status:"range_error",message:`\u6570\u503C ${r} \u5927\u4E8E\u6700\u5927\u503C ${u.maxValue}`}:{valid:!0,status:"pass",message:""}}function R(t,u){return D.has(u.type)?u.minLength!==void 0&&t.length<u.minLength?{valid:!1,status:"length_error",message:`\u5B57\u7B26\u4E32\u957F\u5EA6 ${t.length} \u5C0F\u4E8E\u6700\u5C0F\u957F\u5EA6 ${u.minLength}`}:u.maxLength!==void 0&&t.length>u.maxLength?{valid:!1,status:"length_error",message:`\u5B57\u7B26\u4E32\u957F\u5EA6 ${t.length} \u5927\u4E8E\u6700\u5927\u957F\u5EA6 ${u.maxLength}`}:{valid:!0,status:"pass",message:""}:{valid:!0,status:"pass",message:""}}function w(t,u,r){const e={type:"string",required:!0,...r};if(u===void 0||u==="")return e.required!==!1?{key:t,status:"missing",message:e.message||`\u7F3A\u5C11\u5FC5\u9700\u7684\u73AF\u5883\u53D8\u91CF: ${t}`,value:u,rule:e}:{key:t,status:"pass",message:"",value:e.default??u,rule:e};const i=y(u,e);if(!i.valid)return{key:t,status:i.status,message:e.message||i.message,value:u,rule:e};const s=$(u,e);if(!s.valid)return{key:t,status:s.status,message:e.message||s.message,value:u,rule:e};const n=R(u,e);if(!n.valid)return{key:t,status:n.status,message:e.message||n.message,value:u,rule:e};if(e.pattern&&!e.pattern.test(u))return{key:t,status:"custom_error",message:e.message||`\u73AF\u5883\u53D8\u91CF ${t} \u4E0D\u5339\u914D\u6B63\u5219: ${e.pattern.source}`,value:u,rule:e};if(e.validator){const a=e.validator(u);if(a!==!0){const l=typeof a=="string"?a:"";return{key:t,status:"custom_error",message:e.message||l||`\u73AF\u5883\u53D8\u91CF ${t} \u81EA\u5B9A\u4E49\u6821\u9A8C\u5931\u8D25`,value:u,rule:e}}}return{key:t,status:"pass",message:"",value:u,rule:e}}function _(t,u){const r=[];for(const[e,i]of Object.entries(u)){const s=t[e];r.push(w(e,s,i))}return r}function b(t){const u=new Map,r=[];for(const[i,s]of Object.entries(t)){const n={type:"string",required:!0,...s};if(n.group){const a=u.get(n.group)||[];a.push({key:i,rule:n}),u.set(n.group,a)}else r.push({key:i,rule:n})}const e=[];e.push("# \u73AF\u5883\u53D8\u91CF\u6A21\u677F\u6587\u4EF6"),e.push(`# \u751F\u6210\u65F6\u95F4: ${new Date().toISOString()}`),e.push("# \u7531 @meng-xi/vite-plugin envGuard \u81EA\u52A8\u751F\u6210"),e.push(""),r.length>0&&h(e,"\u901A\u7528\u914D\u7F6E",r);for(const[i,s]of u)h(e,i,s);return e.join(`
`)}function h(t,u,r){t.push("# =============================="),t.push(`# ${u}`),t.push("# =============================="),t.push("");for(const{key:e,rule:i}of r){i.description&&t.push(`# ${i.description}`);const s=[];s.push(`\u7C7B\u578B: ${i.type||"string"}`),s.push(i.required!==!1?"\u5FC5\u9700":"\u53EF\u9009"),i.enumValues&&i.enumValues.length>0&&s.push(`\u679A\u4E3E\u503C: ${i.enumValues.join(" | ")}`),i.minValue!==void 0&&s.push(`\u6700\u5C0F\u503C: ${i.minValue}`),i.maxValue!==void 0&&s.push(`\u6700\u5927\u503C: ${i.maxValue}`),i.minLength!==void 0&&s.push(`\u6700\u5C0F\u957F\u5EA6: ${i.minLength}`),i.maxLength!==void 0&&s.push(`\u6700\u5927\u957F\u5EA6: ${i.maxLength}`),i.sensitive&&s.push("\u26A0\uFE0F \u654F\u611F\u4FE1\u606F"),t.push(`# [${s.join(" | ")}]`),i.default!==void 0?t.push(`${e}=${i.sensitive?"********":i.default}`):t.push(`${e}=`),t.push("")}}function k(t,u,r,e){const i=[];for(const[o,d]of Object.entries(t))d.required!==!1&&i.push({key:o,rule:{type:"string",required:!0,...d}});if(i.length===0)return"";const s=e.filter(o=>o.status!=="pass"),n=i.map(({key:o,rule:d})=>({key:o,type:d.type||"string",description:d.description||""})),a=JSON.stringify(n,null,2),l=s.map(o=>o.key),f=JSON.stringify(l),v=B(r);return`<script>
${`
(function() {
  'use strict';
  var GUARD_NAME = ${JSON.stringify(u)};
  var GUARD_DATA = ${a};
  var FAILED_KEYS = ${f};
  var MODE = ${JSON.stringify(r)};

  var missing = [];
  var invalid = [];

  for (var i = 0; i < GUARD_DATA.length; i++) {
    var item = GUARD_DATA[i];
    var el = document.querySelector('meta[name="env:' + item.key + '"]');
    if (!el) {
      var attr = document.querySelector('[' + item.key + ']');
      if (!attr) {
        missing.push(item.key);
      }
    }
  }

  for (var j = 0; j < FAILED_KEYS.length; j++) {
    if (invalid.indexOf(FAILED_KEYS[j]) === -1 && missing.indexOf(FAILED_KEYS[j]) === -1) {
      invalid.push(FAILED_KEYS[j]);
    }
  }

  var hasIssues = missing.length > 0 || invalid.length > 0;

  var guard = {
    missing: missing,
    invalid: invalid,
    allPassed: !hasIssues,
    data: GUARD_DATA
  };

  if (typeof window !== 'undefined') {
    window[GUARD_NAME] = guard;
  }

  if (hasIssues) {
    ${v}
  }
})();
`.trim()}
<\/script>`}function B(t){switch(t){case"console":return`
    var msgs = [];
    if (missing.length > 0) msgs.push('[EnvGuard] \u7F3A\u5C11\u73AF\u5883\u53D8\u91CF: ' + missing.join(', '));
    if (invalid.length > 0) msgs.push('[EnvGuard] \u73AF\u5883\u53D8\u91CF\u6821\u9A8C\u5931\u8D25: ' + invalid.join(', '));
    for (var k = 0; k < msgs.length; k++) console.warn(msgs[k]);`;case"throw":return`
    var errMsg = '';
    if (missing.length > 0) errMsg += '\u7F3A\u5C11\u73AF\u5883\u53D8\u91CF: ' + missing.join(', ') + '; ';
    if (invalid.length > 0) errMsg += '\u73AF\u5883\u53D8\u91CF\u6821\u9A8C\u5931\u8D25: ' + invalid.join(', ');
    throw new Error('[EnvGuard] ' + errMsg);`;case"overlay":return`
    var overlay = document.createElement('div');
    overlay.id = '__env_guard_overlay__';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#fff3cd;color:#856404;padding:12px 20px;font-size:14px;font-family:monospace;border-bottom:3px solid #ffc107;box-shadow:0 2px 8px rgba(0,0,0,0.15);';
    var html = '<strong>\u26A0\uFE0F EnvGuard \u8B66\u544A</strong><br>';
    if (missing.length > 0) html += '\u7F3A\u5C11: ' + missing.join(', ') + '<br>';
    if (invalid.length > 0) html += '\u6821\u9A8C\u5931\u8D25: ' + invalid.join(', ');
    overlay.innerHTML = html;
    document.addEventListener('DOMContentLoaded', function() { document.body.appendChild(overlay); });`;default:return""}}class x extends F{validationResults=[];guardResult=null;getDefaultOptions(){return{required:{},failAction:"error",generateTemplate:!0,templateOutput:".env.template",runtimeGuard:!1,runtimeGlobalName:"__ENV_GUARD__",runtimeGuardMode:"console",envFiles:[".env",".env.local",".env.production",".env.development"],autoLoadEnv:!0,reportOutput:!1,validateBeforeBuild:!0,showSummary:!0}}validateOptions(){this.validator.field("failAction").enum(["error","warn","ignore"]).field("generateTemplate").boolean().field("runtimeGuard").boolean().field("runtimeGuardMode").enum(["console","throw","overlay"]).field("autoLoadEnv").boolean().field("reportOutput").custom(u=>u===!1||typeof u=="string","reportOutput \u5FC5\u987B\u4E3A false \u6216\u5B57\u7B26\u4E32\u8DEF\u5F84").field("validateBeforeBuild").boolean().field("showSummary").boolean().validate()}getPluginName(){return"env-guard"}addPluginHooks(u){this.options.validateBeforeBuild&&(u.configResolved=()=>{this.runValidation()}),this.options.runtimeGuard&&this.registerTransformIndexHtml(u,r=>this.injectRuntimeGuard(r),"\u6CE8\u5165\u8FD0\u884C\u65F6\u5B88\u536B")}runValidation(){this.options.autoLoadEnv&&this.loadEnvFiles(),this.validationResults=_(process.env,this.options.required),this.guardResult=this.buildResult(),this.options.generateTemplate&&this.writeEnvTemplate(),this.options.reportOutput&&this.writeReport(),this.options.showSummary&&this.logSummary(),this.handleResults()}loadEnvFiles(){if(!this.viteConfig)return;const u=this.viteConfig.root||process.cwd();for(const r of this.options.envFiles){const e=m.resolve(u,r);if(p.existsSync(e))try{this.parseAndLoadEnvFile(e)}catch{this.logger.warn(`\u52A0\u8F7D .env \u6587\u4EF6\u5931\u8D25: ${e}`)}}}parseAndLoadEnvFile(u){const r=p.readFileSync(u,"utf-8"),e=A(r,{prefix:"VITE_"});for(const[i,s]of Object.entries(e))process.env[i]===void 0&&(process.env[i]=s)}buildResult(){const u=this.validationResults.length,r=this.validationResults.filter(s=>s.status==="pass").length,e=this.validationResults.filter(s=>s.status==="missing").length,i=this.validationResults.filter(s=>s.status!=="pass"&&s.status!=="missing").length;return{timestamp:E(new Date,"{YYYY}-{MM}-{DD}T{HH}:{mm}:{ss}"),total:u,passed:r,missing:e,invalid:i,results:this.validationResults,allPassed:e===0&&i===0}}handleResults(){if(!this.guardResult||this.guardResult.allPassed)return;const u=this.validationResults.filter(s=>s.status==="missing").map(s=>s.key),r=this.validationResults.filter(s=>s.status!=="pass"&&s.status!=="missing"),e=[];u.length>0&&e.push(`\u7F3A\u5C11\u5FC5\u9700\u7684\u73AF\u5883\u53D8\u91CF: ${u.join(", ")}`);for(const s of r)e.push(`${s.key}: ${s.message}`);const i=e.join(`
  `);switch(this.options.failAction){case"error":throw new Error(i);case"warn":this.logger.warn(i);break}}writeEnvTemplate(){const u=this.viteConfig?.root||process.cwd(),r=m.resolve(u,this.options.templateOutput),e=b(this.options.required);this.safeExecuteSync(()=>{g(r,e),this.logger.info(`\u73AF\u5883\u53D8\u91CF\u6A21\u677F\u5DF2\u751F\u6210: ${this.options.templateOutput}`)},"\u751F\u6210 .env \u6A21\u677F")}writeReport(){if(!this.guardResult||!this.options.reportOutput)return;const u=this.viteConfig?.build?.outDir||"dist",r=m.resolve(u,this.options.reportOutput);this.safeExecuteSync(()=>{const e=JSON.stringify(this.guardResult,(i,s)=>s instanceof RegExp?s.toString():typeof s=="function"?"[Function]":s,2);g(r,e),this.logger.info(`\u6821\u9A8C\u62A5\u544A\u5DF2\u751F\u6210: ${this.options.reportOutput}`)},"\u751F\u6210\u6821\u9A8C\u62A5\u544A")}logSummary(){if(!this.guardResult)return;const{total:u,passed:r,missing:e,invalid:i,allPassed:s}=this.guardResult;if(s){this.logger.success(`\u73AF\u5883\u53D8\u91CF\u6821\u9A8C\u901A\u8FC7: ${u} \u4E2A\u53D8\u91CF\u5168\u90E8\u5408\u6CD5`);return}this.logger.info(`\u73AF\u5883\u53D8\u91CF\u6821\u9A8C\u7ED3\u679C: \u603B\u8BA1 ${u} | \u901A\u8FC7 ${r} | \u7F3A\u5931 ${e} | \u5931\u8D25 ${i}`);const n=this.validationResults.filter(a=>a.status!=="pass");for(const a of n){const l=a.status==="missing"?"\u7F3A\u5931":"\u5931\u8D25";this.logger.warn(`  [${l}] ${a.key}: ${a.message}`)}}injectRuntimeGuard(u){const r=k(this.options.required,this.options.runtimeGlobalName,this.options.runtimeGuardMode,this.validationResults);if(!r)return u;const e=C(u,"</head>",r);return e.injected?e.html:(this.logger.warn("\u672A\u627E\u5230 </head> \u6807\u7B7E\uFF0C\u8FD0\u884C\u65F6\u5B88\u536B\u4EE3\u7801\u672A\u80FD\u6CE8\u5165"),u)}getResult(){return this.guardResult}getValidationResults(){return[...this.validationResults]}}const O=c(x);export{O as envGuard};
