"use strict";const factory_index=require("../../../factory/index.cjs"),common_script_index=require("../../../common/script/index.cjs"),common_format_index=require("../../../common/format/index.cjs"),common_validation_index=require("../../../common/validation/index.cjs"),common_html_index=require("../../../common/html/index.cjs");require("../../../logger/index.cjs"),require("../../../shared/vite-plugin.Bcg6RW2N.cjs"),require("../../../common/object/index.cjs"),require("../../../shared/vite-plugin.CcvHfrL8.cjs");function generateCSS(e,n){const u=".__vuc-overlay__{position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;pointer-events:none;}";let t="";switch(e){case"modal":t=`.__vuc-modal__{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.15);padding:32px;max-width:420px;width:90%;z-index:100000;pointer-events:auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;text-align:center;}
.__vuc-modal-title__{font-size:18px;font-weight:600;color:#1a1a2e;margin:0 0 12px 0;}
.__vuc-modal-body__{font-size:14px;color:#555;line-height:1.6;margin:0 0 8px 0;}
.__vuc-modal-version__{font-size:12px;color:#999;margin:0 0 24px 0;}
.__vuc-modal-version__ span{font-family:Consolas,'Courier New',monospace;background:#f0f0f0;padding:2px 6px;border-radius:4px;font-size:11px;}
.__vuc-modal-actions__{display:flex;gap:12px;justify-content:center;}
.__vuc-btn__{padding:10px 24px;border-radius:8px;font-size:14px;cursor:pointer;border:none;transition:all 0.2s ease;}
.__vuc-btn-refresh__{background:#4361ee;color:#fff;}
.__vuc-btn-refresh__:hover{background:#3451d1;}
.__vuc-btn-dismiss__{background:#f0f0f0;color:#666;}
.__vuc-btn-dismiss__:hover{background:#e0e0e0;}`;break;case"banner":t=`.__vuc-banner__{position:fixed;top:0;left:0;right:0;background:linear-gradient(135deg,#4361ee,#7c3aed);color:#fff;padding:12px 20px;z-index:100000;pointer-events:auto;display:flex;align-items:center;justify-content:space-between;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;box-shadow:0 2px 12px rgba(67,97,238,0.3);}
.__vuc-banner-text__{font-size:14px;flex:1;}
.__vuc-banner-actions__{display:flex;gap:8px;flex-shrink:0;}
.__vuc-btn-banner-refresh__{background:rgba(255,255,255,0.2);color:#fff;border:1px solid rgba(255,255,255,0.3);padding:6px 16px;border-radius:6px;font-size:13px;cursor:pointer;transition:all 0.2s ease;}
.__vuc-btn-banner-refresh__:hover{background:rgba(255,255,255,0.3);}
.__vuc-btn-banner-dismiss__{background:transparent;color:rgba(255,255,255,0.8);border:none;padding:6px 12px;font-size:13px;cursor:pointer;}
.__vuc-btn-banner-dismiss__:hover{color:#fff;}`;break;case"toast":t=`.__vuc-toast__{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1a1a2e;color:#fff;padding:14px 24px;border-radius:10px;z-index:100000;pointer-events:auto;display:flex;align-items:center;gap:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;box-shadow:0 4px 20px rgba(0,0,0,0.2);max-width:90%;}
.__vuc-toast-text__{font-size:14px;white-space:nowrap;}
.__vuc-btn-toast-refresh__{background:#4361ee;color:#fff;border:none;padding:6px 16px;border-radius:6px;font-size:13px;cursor:pointer;white-space:nowrap;transition:all 0.2s ease;}
.__vuc-btn-toast-refresh__:hover{background:#3451d1;}
.__vuc-btn-toast-dismiss__{background:transparent;color:rgba(255,255,255,0.6);border:none;padding:6px 12px;font-size:13px;cursor:pointer;white-space:nowrap;transition:all 0.2s ease;}
.__vuc-btn-toast-dismiss__:hover{color:#fff;}`;break}return`<style data-vuc-style>${u}${t}${n||""}</style>`}function generateHTMLTemplate(e){const n=e.promptStyle||"modal",u=e.promptMessage||"\u53D1\u73B0\u65B0\u7248\u672C\uFF0C\u662F\u5426\u7ACB\u5373\u5237\u65B0\u83B7\u53D6\u6700\u65B0\u5185\u5BB9\uFF1F",t=e.refreshButtonText||"\u7ACB\u5373\u5237\u65B0",r=e.dismissButtonText||"\u7A0D\u540E\u518D\u8BF4";if(e.customPromptTemplate){const o={message:u,currentVersion:'<span id="__vuc-current__"></span>',newVersion:'<span id="__vuc-new__"></span>',refreshButton:`<button class="__vuc-btn-refresh__" onclick="window.__VUC_REFRESH__()">${t}</button>`,dismissButton:`<button class="__vuc-btn-dismiss__" onclick="window.__VUC_DISMISS__()">${r}</button>`};return common_format_index.parseTemplateWithDelimiter(e.customPromptTemplate,o,"{{","}}")}switch(n){case"modal":return`<div class="__vuc-overlay__"><div class="__vuc-modal__">
<p class="__vuc-modal-title__">\u7248\u672C\u66F4\u65B0</p>
<p class="__vuc-modal-body__">${u}</p>
<p class="__vuc-modal-version__"><span id="__vuc-current__"></span> \u2192 <span id="__vuc-new__"></span></p>
<div class="__vuc-modal-actions__">
<button class="__vuc-btn__ __vuc-btn-dismiss__" onclick="window.__VUC_DISMISS__()">${r}</button>
<button class="__vuc-btn__ __vuc-btn-refresh__" onclick="window.__VUC_REFRESH__()">${t}</button>
</div></div></div>`;case"banner":return`<div class="__vuc-overlay__"><div class="__vuc-banner__">
<span class="__vuc-banner-text__">${u}</span>
<div class="__vuc-banner-actions__">
<button class="__vuc-btn-banner-dismiss__" onclick="window.__VUC_DISMISS__()">${r}</button>
<button class="__vuc-btn-banner-refresh__" onclick="window.__VUC_REFRESH__()">${t}</button>
</div></div></div>`;case"toast":return`<div class="__vuc-overlay__"><div class="__vuc-toast__">
<span class="__vuc-toast-text__">${u}</span>
<button class="__vuc-btn-toast-dismiss__" onclick="window.__VUC_DISMISS__()">${r}</button>
<button class="__vuc-btn-toast-refresh__" onclick="window.__VUC_REFRESH__()">${t}</button>
</div></div>`;default:return`<div class="__vuc-overlay__"><div class="__vuc-modal__">
<p class="__vuc-modal-title__">\u7248\u672C\u66F4\u65B0</p>
<p class="__vuc-modal-body__">${u}</p>
<p class="__vuc-modal-version__"><span id="__vuc-current__"></span> \u2192 <span id="__vuc-new__"></span></p>
<div class="__vuc-modal-actions__">
<button class="__vuc-btn__ __vuc-btn-dismiss__" onclick="window.__VUC_DISMISS__()">${r}</button>
<button class="__vuc-btn__ __vuc-btn-refresh__" onclick="window.__VUC_REFRESH__()">${t}</button>
</div></div></div>`}}function generateCheckerCode(e){const n=e.versionSource||"auto",u=e.defineName||"__APP_VERSION__",t=e.checkUrl||"/version.json",r=e.checkInterval||3e5,o=e.checkOnVisibilityChange!==!1,i=e.enableInDev||!1,a=common_script_index.makeCallback(e.onUpdateAvailable,"versionUpdateChecker","currentVersion, newVersion"),_=common_script_index.makeCallback(e.onRefresh,"versionUpdateChecker","currentVersion, newVersion"),c=common_script_index.makeCallback(e.onDismiss,"versionUpdateChecker","currentVersion, newVersion");let s="";return(n==="define"||n==="auto")&&(s=`
    // \u4F18\u5148\u4ECE define \u5168\u5C40\u53D8\u91CF\u8BFB\u53D6
    if (typeof ${u} !== 'undefined') return ${u};`),(n==="file"||n==="auto")&&(s+=`
    // \u4ECE\u9875\u9762 meta \u6807\u7B7E\u8BFB\u53D6
    var metaEl = document.querySelector('meta[name="app-version"]');
    if (metaEl && metaEl.getAttribute('content')) return metaEl.getAttribute('content');`),s+=`
    return null;`,`;(function() {
  'use strict';

  // SSR \u73AF\u5883\u68C0\u6D4B
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // \u5F00\u53D1\u6A21\u5F0F\u68C0\u6D4B
  var _isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development';
  if (_isDev && !${JSON.stringify(i)}) return;

  // \u72B6\u6001
  var _currentVersion = null;
  var _latestVersion = null;
  var _promptVisible = false;
  var _dismissed = false;
  var _delayTimer = null;
  var _intervalTimer = null;
  var _destroyed = false;

  // \u83B7\u53D6\u5F53\u524D\u7248\u672C\u53F7
  function _getCurrentVersion() {${s}
  }

  // \u68C0\u67E5\u7248\u672C\u66F4\u65B0
  function _checkForUpdate() {
    if (_destroyed || _dismissed || _promptVisible) return;

    var xhr = new XMLHttpRequest();
    xhr.open('GET', ${JSON.stringify(t)} + '?_t=' + Date.now(), true);
    xhr.timeout = 10000;
    xhr.onreadystatechange = function() {
      if (xhr.readyState !== 4) return;
      if (xhr.status !== 200) return;
      try {
        var data = JSON.parse(xhr.responseText);
        _latestVersion = data.version || data;
        if (!_currentVersion) _currentVersion = _getCurrentVersion();
        if (!_currentVersion || !_latestVersion) return;
        if (_currentVersion === _latestVersion) return;

        // \u7248\u672C\u4E0D\u4E00\u81F4\uFF0C\u53D1\u73B0\u66F4\u65B0
        var shouldShow = (${a})(_currentVersion, _latestVersion);
        if (shouldShow !== false) {
          _showPrompt();
        }
      } catch(e) {
        // \u89E3\u6790\u5931\u8D25\uFF0C\u9759\u9ED8\u5FFD\u7565
      }
    };
    xhr.send();
  }

  // \u663E\u793A\u66F4\u65B0\u63D0\u793A
  function _showPrompt() {
    if (_promptVisible || _destroyed) return;
    _promptVisible = true;

    var container = document.getElementById('__vuc-root__');
    if (!container) return;

    container.style.display = '';

    // \u586B\u5145\u7248\u672C\u53F7
    var currentEl = document.getElementById('__vuc-current__');
    var newEl = document.getElementById('__vuc-new__');
    if (currentEl) currentEl.textContent = _currentVersion;
    if (newEl) newEl.textContent = _latestVersion;
  }

  // \u9690\u85CF\u66F4\u65B0\u63D0\u793A
  function _hidePrompt() {
    _promptVisible = false;
    var container = document.getElementById('__vuc-root__');
    if (container) container.style.display = 'none';
  }

  // \u5237\u65B0\u9875\u9762
  window.__VUC_REFRESH__ = function() {
    (${_})(_currentVersion, _latestVersion);
    window.location.reload();
  };

  // \u5FFD\u7565\u66F4\u65B0
  window.__VUC_DISMISS__ = function() {
    (${c})(_currentVersion, _latestVersion);
    _dismissed = true;
    _hidePrompt();
  };

  // \u542F\u52A8\u5B9A\u65F6\u68C0\u67E5
  function _startChecking() {
    _currentVersion = _getCurrentVersion();
    if (!_currentVersion) {
      console.warn('[versionUpdateChecker] \u65E0\u6CD5\u83B7\u53D6\u5F53\u524D\u7248\u672C\u53F7\uFF0C\u7248\u672C\u68C0\u67E5\u5DF2\u8DF3\u8FC7\u3002\u8BF7\u786E\u8BA4 generateVersion \u63D2\u4EF6\u5DF2\u6B63\u786E\u914D\u7F6E\u3002');
      return;
    }

    // \u9996\u6B21\u5EF6\u8FDF 10 \u79D2\u68C0\u67E5\uFF0C\u907F\u514D\u9875\u9762\u521A\u52A0\u8F7D\u5C31\u5F39\u51FA
    _delayTimer = setTimeout(function() {
      _checkForUpdate();
      // \u4E4B\u540E\u6309\u95F4\u9694\u5B9A\u671F\u68C0\u67E5
      _intervalTimer = setInterval(_checkForUpdate, ${r});
    }, 10000);
  }

  // \u9500\u6BC1\u68C0\u67E5\u5668\uFF0C\u6E05\u7406\u5B9A\u65F6\u5668\u548C DOM
  function _destroy() {
    _destroyed = true;
    if (_delayTimer) { clearTimeout(_delayTimer); _delayTimer = null; }
    if (_intervalTimer) { clearInterval(_intervalTimer); _intervalTimer = null; }
    var container = document.getElementById('__vuc-root__');
    if (container) container.parentNode.removeChild(container);
    var styleEl = document.querySelector('style[data-vuc-style]');
    if (styleEl) styleEl.parentNode.removeChild(styleEl);
    delete window.__VUC_REFRESH__;
    delete window.__VUC_DISMISS__;
  }

  // \u9875\u9762\u53EF\u89C1\u6027\u53D8\u5316\u65F6\u68C0\u67E5
  ${o?`
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden && !_destroyed && !_dismissed && !_promptVisible) {
      _checkForUpdate();
    }
  });`:""}

  // DOM \u5C31\u7EEA\u540E\u542F\u52A8
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _startChecking);
  } else {
    _startChecking();
  }
})();`}function generateMetaTag(e){const n=e.versionSource||"auto";return n!=="file"&&n!=="auto"?"":`<meta name="app-version" content="${e.defineName||"__APP_VERSION__"}">`}function generateFullInjectCode(e){const n=generateCSS(e.promptStyle||"modal",e.customStyle),u=generateHTMLTemplate(e),t=generateCheckerCode(e);return`${n}
<div id="__vuc-root__" style="display:none">${u}</div>
<script>${t}<\/script>`}function validateCallbacks(e){common_validation_index.validateCallbackFields(e,["onUpdateAvailable","onRefresh","onDismiss"],"callbacks")}function validateAll(e){common_validation_index.validateNoScriptInTemplate(e.customPromptTemplate,"customPromptTemplate"),validateCallbacks(e),common_validation_index.validateGlobalName(e.defineName,"defineName")}class p extends factory_index.BasePlugin{getDefaultOptions(){return{versionSource:"auto",defineName:"__APP_VERSION__",checkUrl:"/version.json",checkInterval:3e5,checkOnVisibilityChange:!0,enableInDev:!1,promptStyle:"modal",promptMessage:"\u53D1\u73B0\u65B0\u7248\u672C\uFF0C\u662F\u5426\u7ACB\u5373\u5237\u65B0\u83B7\u53D6\u6700\u65B0\u5185\u5BB9\uFF1F",refreshButtonText:"\u7ACB\u5373\u5237\u65B0",dismissButtonText:"\u7A0D\u540E\u518D\u8BF4"}}validateOptions(){this.validator.field("versionSource").enum(["define","file","auto"]).field("promptStyle").enum(["modal","banner","toast"]).field("checkInterval").number().minValue(5e3).validate(),validateAll(this.options)}getPluginName(){return"version-update-checker"}addPluginHooks(n){const u=generateFullInjectCode(this.options),t=generateMetaTag(this.options);this.registerTransformIndexHtml(n,r=>{const o=common_html_index.injectHeadAndBody(r,t,u);return o.usedFallback&&this.logger.warn("\u672A\u627E\u5230 </body> \u6216 </html> \u6807\u7B7E\uFF0C\u7248\u672C\u66F4\u65B0\u68C0\u67E5\u4EE3\u7801\u8FFD\u52A0\u5230\u6587\u4EF6\u672B\u5C3E"),o.bodyInjected&&this.logger.success("\u6210\u529F\u6CE8\u5165\u7248\u672C\u66F4\u65B0\u68C0\u67E5\u4EE3\u7801\u5230 HTML \u6587\u4EF6"),o.html},"\u6CE8\u5165\u7248\u672C\u66F4\u65B0\u68C0\u67E5\u4EE3\u7801")}}const versionUpdateChecker=factory_index.createPluginFactory(p);exports.versionUpdateChecker=versionUpdateChecker;
