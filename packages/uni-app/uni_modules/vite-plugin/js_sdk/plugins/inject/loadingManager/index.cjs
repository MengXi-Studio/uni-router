"use strict";const factory_index=require("../../../factory/index.cjs"),security=require("../../../shared/vite-plugin.CcvHfrL8.cjs"),common_script_index=require("../../../common/script/index.cjs"),common_validation_index=require("../../../common/validation/index.cjs"),common_html_index=require("../../../common/html/index.cjs");require("../../../logger/index.cjs"),require("../../../shared/vite-plugin.Bcg6RW2N.cjs"),require("../../../common/object/index.cjs");const CLS_OVERLAY="__loading-overlay__",CLS_HIDDEN="__loading-hidden__",CLS_VISIBLE="__loading-visible__",CLS_TOP="__loading-top__",CLS_CENTER="__loading-center__",CLS_BOTTOM="__loading-bottom__",CLS_SPINNER="__loading-spinner__",CLS_TEXT="__loading-text__",CLS_DOT="__loading-dot__",ID_ROOT="__loading-root__",ATTR_TEXT="data-loading-text",ANIM_SPIN="__loading-spin__",ANIM_DOTS="__loading-dots__",ANIM_PULSE="__loading-pulse__",ANIM_BAR="__loading-bar__",POSITION_CLASS_MAP={center:CLS_CENTER,top:CLS_TOP,bottom:CLS_BOTTOM};function generateCSS(e,t="spinner",n){const{overlayColor:o="rgba(255, 255, 255, 0.7)",spinnerColor:a="#4361ee",spinnerSize:u="40px",textColor:r="#333",textSize:l="14px",zIndex:c=9999,pointerEvents:m=!0,backdropBlur:d=!1,backdropBlurAmount:_=4}=e,h=m?"":"pointer-events: none;",y=d?`backdrop-filter: blur(${_}px);-webkit-backdrop-filter: blur(${_}px);`:"",E=getSpinnerCSS(t,a,u),b=n?.enabled!==!1,f=n?.duration??200,g=n?.easing??"ease-out",p=b?`transition: opacity ${f}ms ${g}, visibility ${f}ms ${g};`:"";return`
.${CLS_OVERLAY} {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${o};
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: ${c};
  ${h}
  ${y}
  contain: content;
  will-change: opacity;
}
.${CLS_OVERLAY}.${CLS_TOP} {
  justify-content: flex-start;
  padding-top: 60px;
}
.${CLS_OVERLAY}.${CLS_CENTER} {
  justify-content: center;
}
.${CLS_OVERLAY}.${CLS_BOTTOM} {
  justify-content: flex-end;
  padding-bottom: 60px;
}
${E}
.${CLS_TEXT} {
  margin-top: 12px;
  color: ${r};
  font-size: ${l};
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  user-select: none;
}
.${CLS_OVERLAY}.${CLS_HIDDEN} {
  opacity: 0;
  visibility: hidden;
  ${p}
}
.${CLS_OVERLAY}.${CLS_HIDDEN} .${CLS_SPINNER},
.${CLS_OVERLAY}.${CLS_HIDDEN} .${CLS_DOT},
.${CLS_OVERLAY}.${CLS_HIDDEN} .${CLS_SPINNER}::after {
  animation-play-state: paused;
}
.${CLS_OVERLAY}.${CLS_VISIBLE} {
  opacity: 1;
  visibility: visible;
  ${p}
}
.${CLS_OVERLAY}.${CLS_VISIBLE} .${CLS_SPINNER},
.${CLS_OVERLAY}.${CLS_VISIBLE} .${CLS_DOT},
.${CLS_OVERLAY}.${CLS_VISIBLE} .${CLS_SPINNER}::after {
  animation-play-state: running;
}`}function getSpinnerCSS(e,t,n){switch(e){case"dots":return`
.${CLS_SPINNER} {
  display: flex;
  gap: 6px;
  align-items: center;
}
.${CLS_SPINNER} .${CLS_DOT} {
  width: calc(${n} / 4);
  height: calc(${n} / 4);
  border-radius: 50%;
  background: ${t};
  animation: ${ANIM_DOTS} 1.2s ease-in-out infinite;
}
.${CLS_SPINNER} .${CLS_DOT}:nth-child(2) { animation-delay: 0.15s; }
.${CLS_SPINNER} .${CLS_DOT}:nth-child(3) { animation-delay: 0.3s; }
@keyframes ${ANIM_DOTS} {
  0%, 80%, 100% { transform: scale(0.4); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}`;case"pulse":return`
.${CLS_SPINNER} {
  width: ${n};
  height: ${n};
  background: ${t};
  border-radius: 50%;
  animation: ${ANIM_PULSE} 1.2s ease-in-out infinite;
}
@keyframes ${ANIM_PULSE} {
  0% { transform: scale(0.3); opacity: 0.3; }
  50% { transform: scale(1); opacity: 1; }
  100% { transform: scale(0.3); opacity: 0.3; }
}`;case"bar":return`
.${CLS_SPINNER} {
  width: calc(${n} * 2.5);
  height: calc(${n} / 5);
  background: rgba(0, 0, 0, 0.08);
  border-radius: calc(${n} / 10);
  overflow: hidden;
  position: relative;
}
.${CLS_SPINNER}::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 40%;
  background: ${t};
  border-radius: calc(${n} / 10);
  animation: ${ANIM_BAR} 1.2s ease-in-out infinite;
}
@keyframes ${ANIM_BAR} {
  0% { left: -40%; }
  100% { left: 100%; }
}`;default:return`
.${CLS_SPINNER} {
  width: ${n};
  height: ${n};
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-top-color: ${t};
  border-radius: 50%;
  animation: ${ANIM_SPIN} 0.8s linear infinite;
}
@keyframes ${ANIM_SPIN} {
  to { transform: rotate(360deg); }
}`}}function generateHTMLTemplate(e){const t=e.position||"center",n=e.defaultText||"\u52A0\u8F7D\u4E2D...",o=e.spinnerType||"spinner",a=POSITION_CLASS_MAP[t],u=e.style?.customClass?` ${e.style.customClass}`:"",r=e.style?.customStyle?` style="${security.escapeHtmlAttr(e.style.customStyle)}"`:"",l=e.defaultVisible?CLS_VISIBLE:CLS_HIDDEN;if(e.customTemplate)return`<div class="${CLS_OVERLAY} ${a} ${l}${u}" id="${ID_ROOT}"${r}>${e.customTemplate}</div>`;const c=getSpinnerHTML(o);return`<div class="${CLS_OVERLAY} ${a} ${l}${u}" id="${ID_ROOT}"${r}>
  ${c}
  <div class="${CLS_TEXT}" ${ATTR_TEXT}>${n}</div>
</div>`}function getSpinnerHTML(e){switch(e){case"dots":return`<div class="${CLS_SPINNER}"><div class="${CLS_DOT}"></div><div class="${CLS_DOT}"></div><div class="${CLS_DOT}"></div></div>`;default:return`<div class="${CLS_SPINNER}"></div>`}}function generateVarsCode(e){return`  var _loadingEl = null;
  var _textEl = null;
  var _styleEl = null;
  var _visible = false;
  var _destroyed = false;
  var _showTimer = null;
  var _hideTimer = null;
  var _debounceTimer = null;
  var _retryTimer = null;
  var _showTime = 0;
  var _pendingCount = 0;
  var _showRetryCount = 0;
  var _maxShowRetries = 20;

  // \u914D\u7F6E
  var _minDisplayTime = ${JSON.stringify(e.minDisplayTime)};
  var _delayShow = ${JSON.stringify(e.delayShow)};
  var _debounceHide = ${JSON.stringify(e.debounceHide)};
  var _transition = ${JSON.stringify(e.transition)};
  var _excludeUrls = ${JSON.stringify(e.excludeUrls.map(t=>({source:t.source,flags:t.flags})))}.map(function(s) { return new RegExp(s.source, s.flags); });
  var _includeUrls = ${JSON.stringify(e.includeUrls.map(t=>({source:t.source,flags:t.flags})))}.map(function(s) { return new RegExp(s.source, s.flags); });
  var _excludeMethods = ${JSON.stringify(e.excludeMethods)};
  var _excludeUrlPrefixes = ${JSON.stringify(e.excludeUrlPrefixes)};

  // \u56DE\u8C03
  var _onBeforeShow = ${e.cbBeforeShow};
  var _onShow = ${e.cbShow};
  var _onBeforeHide = ${e.cbBeforeHide};
  var _onHide = ${e.cbHide};
  var _onDestroy = ${e.cbDestroy};

  // \u4FDD\u5B58\u539F\u59CB\u65B9\u6CD5\u5F15\u7528\uFF0C\u7528\u4E8E destroy \u65F6\u6062\u590D
  var _originalFetch = null;
  var _originalXHROpen = null;
  var _originalXHRSend = null;`}function generateHelpersCode(e){return`  function _findEl() {
    if (!_loadingEl) {
      _loadingEl = document.getElementById('${ID_ROOT}');
    }
    if (!_textEl && _loadingEl) {
      _textEl = _loadingEl.querySelector('[${ATTR_TEXT}]');
    }
    if (!_styleEl) {
      _styleEl = document.querySelector('style[data-loading-id="${e}"]');
    }
  }

  function _shouldFilter(url, method) {
    if (!url) return false;
    var upperMethod = (method || 'GET').toUpperCase();
    for (var i = 0; i < _excludeMethods.length; i++) {
      if (upperMethod === _excludeMethods[i].toUpperCase()) return true;
    }
    for (var i = 0; i < _excludeUrlPrefixes.length; i++) {
      if (url.indexOf(_excludeUrlPrefixes[i]) === 0) return true;
    }
    if (_includeUrls.length > 0) {
      var included = false;
      for (var i = 0; i < _includeUrls.length; i++) {
        _includeUrls[i].lastIndex = 0;
        if (_includeUrls[i].test(url)) { included = true; break; }
      }
      if (!included) return true;
    }
    for (var i = 0; i < _excludeUrls.length; i++) {
      _excludeUrls[i].lastIndex = 0;
      if (_excludeUrls[i].test(url)) return true;
    }
    return false;
  }

  function _clearTimers() {
    if (_showTimer) { clearTimeout(_showTimer); _showTimer = null; }
    if (_hideTimer) { clearTimeout(_hideTimer); _hideTimer = null; }
    if (_debounceTimer) { clearTimeout(_debounceTimer); _debounceTimer = null; }
    if (_retryTimer) { clearTimeout(_retryTimer); _retryTimer = null; }
  }

  function _applyTransition(show) {
    if (!_transition.enabled || !_loadingEl) return;
    var d = _transition.duration || 200;
    var e = _transition.easing || 'ease-out';
    _loadingEl.style.transition = 'opacity ' + d + 'ms ' + e + ', visibility ' + d + 'ms ' + e;
  }`}function generateCoreLogicCode(){return`  function _applyHide() {
    if (!_loadingEl) return;
    _loadingEl.classList.remove('${CLS_VISIBLE}');
    _loadingEl.classList.add('${CLS_HIDDEN}');
    _applyTransition(false);
    _visible = false;
    _showTime = 0;
    _onHide();
  }

  function _doShow(text) {
    if (_destroyed) return;
    _findEl();
    if (!_loadingEl) {
      if (++_showRetryCount > _maxShowRetries) return;
      _retryTimer = setTimeout(function() { _retryTimer = null; _doShow(text); }, 50);
      return;
    }
    _showRetryCount = 0;

    var result = _onBeforeShow();
    if (result === false) return;

    if (_textEl && text) _textEl.textContent = text;
    _loadingEl.classList.remove('${CLS_HIDDEN}');
    _loadingEl.classList.add('${CLS_VISIBLE}');
    _applyTransition(true);
    _visible = true;
    _showTime = Date.now();
    _onShow();
  }

  function _doHide(force) {
    if (_destroyed) return;
    if (!_visible && !force) return;
    _findEl();
    if (!_loadingEl) return;

    if (!force) {
      var result = _onBeforeHide();
      if (result === false) return;
    }

    if (!force && _minDisplayTime.enabled && _showTime > 0) {
      var elapsed = Date.now() - _showTime;
      var remaining = _minDisplayTime.duration - elapsed;
      if (remaining > 0) {
        if (_hideTimer) clearTimeout(_hideTimer);
        _hideTimer = setTimeout(function() { _hideTimer = null; _doHide(true); }, remaining);
        return;
      }
    }

    if (_debounceHide.enabled && !force) {
      if (_debounceTimer) clearTimeout(_debounceTimer);
      _debounceTimer = setTimeout(function() { _debounceTimer = null; _applyHide(); }, _debounceHide.duration);
      return;
    }

    _applyHide();
  }

  function _restoreInterceptors() {
    if (_originalFetch && typeof window !== 'undefined' && window.fetch) {
      window.fetch = _originalFetch;
      _originalFetch = null;
    }
    if (_originalXHROpen && typeof window !== 'undefined' && window.XMLHttpRequest) {
      XMLHttpRequest.prototype.open = _originalXHROpen;
      XMLHttpRequest.prototype.send = _originalXHRSend;
      _originalXHROpen = null;
      _originalXHRSend = null;
    }
  }`}function generateManagerObjectCode(){return`    show: function(text) {
      if (_destroyed) return;
      _clearTimers();
      _showTime = 0;
      _showRetryCount = 0;
      if (_delayShow.enabled && _delayShow.duration > 0) {
        _showTimer = setTimeout(function() { _showTimer = null; _doShow(text); }, _delayShow.duration);
      } else {
        _doShow(text);
      }
    },
    hide: function() {
      if (_destroyed) return;
      if (_showTimer) { clearTimeout(_showTimer); _showTimer = null; }
      _doHide(false);
    },
    forceHide: function() {
      if (_destroyed) return;
      _clearTimers();
      _doHide(true);
    },
    toggle: function(text) {
      if (_destroyed) return;
      if (_visible) {
        this.hide();
      } else {
        this.show(text);
      }
    },
    enablePointerEvents: function() {
      if (_destroyed) return;
      _findEl();
      if (_loadingEl) _loadingEl.style.pointerEvents = 'auto';
    },
    disablePointerEvents: function() {
      if (_destroyed) return;
      _findEl();
      if (_loadingEl) _loadingEl.style.pointerEvents = 'none';
    },
    togglePointerEvents: function() {
      if (_destroyed) return;
      _findEl();
      if (!_loadingEl) return;
      if (_loadingEl.style.pointerEvents === 'none') {
        this.enablePointerEvents();
      } else {
        this.disablePointerEvents();
      }
    },
    updateText: function(text) {
      if (_destroyed) return;
      _findEl();
      if (_textEl) _textEl.textContent = text;
    },
    isVisible: function() {
      return _visible && !_destroyed;
    },
    isPointerEventsEnabled: function() {
      if (_destroyed) return false;
      _findEl();
      if (!_loadingEl) return false;
      return _loadingEl.style.pointerEvents !== 'none';
    },
    getPendingCount: function() {
      return _pendingCount;
    },
    destroy: function() {
      if (_destroyed) return;
      _destroyed = true;
      _clearTimers();
      _findEl();
      if (_loadingEl && _loadingEl.parentNode) {
        _loadingEl.parentNode.removeChild(_loadingEl);
      }
      if (_styleEl && _styleEl.parentNode) {
        _styleEl.parentNode.removeChild(_styleEl);
      }
      _loadingEl = null;
      _textEl = null;
      _styleEl = null;
      _visible = false;
      _showTime = 0;
      _pendingCount = 0;
      _restoreInterceptors();
      _onDestroy();
    },
    _requestStart: function(url, method) {
      if (_destroyed) return;
      if (_shouldFilter(url, method)) return;
      _pendingCount++;
      if (_pendingCount === 1) this.show();
    },
    _requestEnd: function(url, method) {
      if (_destroyed) return;
      if (_shouldFilter(url, method)) return;
      _pendingCount = Math.max(0, _pendingCount - 1);
      if (_pendingCount === 0) this.hide();
    }`}function generateInterceptorsCode(e){let t="";return(e==="fetch"||e==="all")&&(t+=`  // \u81EA\u52A8\u62E6\u622A fetch
  if (typeof window !== 'undefined' && window.fetch) {
    _originalFetch = window.fetch;
    window.fetch = function(input, init) {
      var url = typeof input === 'string' ? input : (input instanceof URL ? input.href : (input && input.url ? input.url : ''));
      var method = (init && init.method) || (input && input.method) || 'GET';
      manager._requestStart(url, method);
      return _originalFetch.apply(this, arguments).then(
        function(response) { manager._requestEnd(url, method); return response; },
        function(error) { manager._requestEnd(url, method); throw error; }
      );
    };
  }
`),(e==="xhr"||e==="all")&&(t+=`  // \u81EA\u52A8\u62E6\u622A XMLHttpRequest
  if (typeof window !== 'undefined' && window.XMLHttpRequest) {
    _originalXHROpen = XMLHttpRequest.prototype.open;
    _originalXHRSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function(method, url) {
      this.__loadingUrl = url || '';
      this.__loadingMethod = method || 'GET';
      return _originalXHROpen.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function() {
      var self = this;
      manager._requestStart(self.__loadingUrl, self.__loadingMethod);
      self.addEventListener('loadend', function() {
        manager._requestEnd(self.__loadingUrl, self.__loadingMethod);
      });
      return _originalXHRSend.apply(this, arguments);
    };
  }
`),t.trimEnd()}function generateInitCode(e,t,n){let o="";return o+=`  // defaultVisible: \u540C\u6B65\u521D\u59CB\u53EF\u89C1\u72B6\u6001
  var _defaultVisible = ${JSON.stringify(e)};
  if (_defaultVisible) {
    _visible = true;
    _showTime = Date.now();
  }
`,e&&t!=="manual"&&(o+=`
  // autoHideOn: \u81EA\u52A8\u9690\u85CF\u65F6\u673A
  var _autoHideOn = '${t}';
  function _autoHideHandler() {
    manager.hide();
  }
  if (_autoHideOn === 'load') {
    if (document.readyState === 'complete') {
      _autoHideHandler();
    } else {
      window.addEventListener('load', _autoHideHandler);
    }
  } else {
    if (document.readyState !== 'loading') {
      _autoHideHandler();
    } else {
      document.addEventListener('DOMContentLoaded', _autoHideHandler);
    }
  }
`),o+=`
  // \u66B4\u9732\u5230\u5168\u5C40
  window['${n}'] = manager;`,o}function generateLoadingManagerCode(e){const t=e.globalName||"__LOADING_MANAGER__",n=e.minDisplayTime||{enabled:!0,duration:300},o=e.delayShow||{enabled:!0,duration:200},a=e.debounceHide||{enabled:!1,duration:100},u=e.transition||{enabled:!0,duration:200,easing:"ease-out"},r=e.autoBind||"none",l=e.requestFilter||{},c=e.defaultVisible||!1,m=e.autoHideOn||"DOMContentLoaded",d=e.callbacks||{},_=l.excludeUrls||[],h=l.includeUrls||[],y=l.excludeMethods||[],E=l.excludeUrlPrefixes||[],b=common_script_index.makeCallback(d.onBeforeShow,"loadingManager"),f=common_script_index.makeCallback(d.onShow,"loadingManager"),g=common_script_index.makeCallback(d.onBeforeHide,"loadingManager"),p=common_script_index.makeCallback(d.onHide,"loadingManager"),$=common_script_index.makeCallback(d.onDestroy,"loadingManager"),v=generateVarsCode({minDisplayTime:n,delayShow:o,debounceHide:a,transition:u,excludeUrls:_,includeUrls:h,excludeMethods:y,excludeUrlPrefixes:E,cbBeforeShow:b,cbShow:f,cbBeforeHide:g,cbHide:p,cbDestroy:$}),w=generateHelpersCode(t),C=generateCoreLogicCode(),x=generateManagerObjectCode(),S=generateInterceptorsCode(r),H=generateInitCode(c,m,t);return`(function() {
  'use strict';

  // SSR \u73AF\u5883\u68C0\u6D4B
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

${v}

${w}

${C}

  var manager = {
${x}
  };

${S}

${H}
})();`}function i(e,t){if(e!==void 0&&(typeof e!="number"||e<0))throw new Error(`${t} \u5FC5\u987B\u662F\u975E\u8D1F\u6570`)}function validateStyle(e){if(!e)return;const{zIndex:t,pointerEvents:n,backdropBlurAmount:o}=e;if(i(t,"style.zIndex"),n!==void 0&&typeof n!="boolean")throw new Error("style.pointerEvents \u5FC5\u987B\u662F\u5E03\u5C14\u503C");i(o,"style.backdropBlurAmount")}function validateTransition(e){if(!e)return;const{duration:t,easing:n}=e;if(i(t,"transition.duration"),n!==void 0&&typeof n!="string")throw new Error("transition.easing \u5FC5\u987B\u662F\u5B57\u7B26\u4E32\u7C7B\u578B")}function validateCallbacks(e){e&&common_validation_index.validateCallbackFields(e,["onBeforeShow","onShow","onBeforeHide","onHide","onDestroy"],"callbacks")}function validateDefaultText(e){return e===""?"defaultText \u4E3A\u7A7A\u5B57\u7B26\u4E32\uFF0Cloading \u5C06\u4E0D\u663E\u793A\u6587\u672C\u5185\u5BB9":null}function validateAutoHideOn(e,t){return!e&&t?"autoHideOn \u4EC5\u5728 defaultVisible \u4E3A true \u65F6\u751F\u6548\uFF0C\u5F53\u524D defaultVisible \u4E3A false\uFF0CautoHideOn \u914D\u7F6E\u5C06\u88AB\u5FFD\u7565":null}function s(e,t){if(e?.duration!==void 0&&(typeof e.duration!="number"||e.duration<0))throw new Error(t)}class T extends factory_index.BasePlugin{getDefaultOptions(){return{position:"center",defaultText:"\u52A0\u8F7D\u4E2D...",spinnerType:"spinner",autoBind:"none",globalName:"__LOADING_MANAGER__",defaultVisible:!1,autoHideOn:"DOMContentLoaded",style:{overlayColor:"rgba(255, 255, 255, 0.7)",spinnerColor:"#4361ee",spinnerSize:"40px",textColor:"#333",textSize:"14px",zIndex:9999,pointerEvents:!0,backdropBlur:!1,backdropBlurAmount:4},transition:{enabled:!0,duration:200,easing:"ease-out"},minDisplayTime:{enabled:!0,duration:300},delayShow:{enabled:!0,duration:200},debounceHide:{enabled:!1,duration:100}}}validateOptions(){this.validator.field("position").enum(["center","top","bottom"]).field("defaultText").string().field("spinnerType").enum(["spinner","dots","pulse","bar"]).field("autoBind").enum(["fetch","xhr","all","none"]).field("globalName").string().field("customTemplate").string().field("defaultVisible").boolean().field("autoHideOn").enum(["DOMContentLoaded","load","manual"]).validate(),common_validation_index.validateNoScriptInTemplate(this.options.customTemplate,"customTemplate");const t=validateDefaultText(this.options.defaultText);t&&this.logger.warn(t),common_validation_index.validateGlobalName(this.options.globalName,"globalName"),validateStyle(this.options.style),s(this.options.minDisplayTime,"minDisplayTime.duration \u5FC5\u987B\u662F\u975E\u8D1F\u6570"),s(this.options.delayShow,"delayShow.duration \u5FC5\u987B\u662F\u975E\u8D1F\u6570"),s(this.options.debounceHide,"debounceHide.duration \u5FC5\u987B\u662F\u975E\u8D1F\u6570"),validateTransition(this.options.transition),validateCallbacks(this.options.callbacks);const n=validateAutoHideOn(this.options.defaultVisible,this.options.autoHideOn);n&&this.logger.warn(n)}getPluginName(){return"loading-manager"}generateLoadingManager(t){return generateLoadingManagerCode(t)}generateHeadInjectCode(){const{css:t,html:n}=this.getCachedAssets();return`<!-- loading-manager: head start -->
<style data-loading-style data-loading-id="${this.options.globalName||"__LOADING_MANAGER__"}">${t}</style>
${n}
<!-- loading-manager: head end -->`}generateBodyInjectCode(t){const n=this.generateLoadingManager(this.options);if(t)return`<!-- loading-manager: body start -->
<script>${n}<\/script>
<!-- loading-manager: body end -->`;const{css:o,html:a}=this.getCachedAssets();return`<!-- loading-manager: start -->
<script>
(function() {
  // SSR \u73AF\u5883\u68C0\u6D4B
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // \u6CE8\u5165 CSS
  var style = document.createElement('style');
  style.setAttribute('data-loading-style', '');
  style.setAttribute('data-loading-id', '${this.options.globalName||"__LOADING_MANAGER__"}');
  style.textContent = ${JSON.stringify(o)};
  document.head.appendChild(style);

  // \u6CE8\u5165 HTML\uFF08\u7B49\u5F85 body \u53EF\u7528\u65F6\u6267\u884C\uFF09
  function injectHTML() {
    var div = document.createElement('div');
    div.innerHTML = ${JSON.stringify(a)};
    while (div.firstChild) {
      document.body.appendChild(div.firstChild);
    }
  }

  if (document.body) {
    injectHTML();
  } else {
    document.addEventListener('DOMContentLoaded', injectHTML);
  }
})();
${n}
<\/script>
<!-- loading-manager: end -->`}_cachedAssets=null;getCachedAssets(){if(!this._cachedAssets){const t=this.options.style||{},n=this.options.spinnerType||"spinner",o=this.options.transition;this._cachedAssets={css:generateCSS(t,n,o),html:generateHTMLTemplate(this.options)}}return this._cachedAssets}addPluginHooks(t){const n=this.options.defaultVisible||!1,o=n?this.generateHeadInjectCode():void 0,a=this.generateBodyInjectCode(n);this.registerTransformIndexHtml(t,u=>{const r=common_html_index.injectHeadAndBody(u,o,a);return o&&!r.headInjected&&this.logger.warn("\u672A\u627E\u5230 </head> \u6807\u7B7E\uFF0CdefaultVisible \u7684\u767D\u5C4F loading \u5C06\u65E0\u6CD5\u751F\u6548"),r.usedFallback&&this.logger.warn("\u672A\u627E\u5230 </body> \u6216 </html> \u6807\u7B7E\uFF0CLoading \u4EE3\u7801\u8FFD\u52A0\u5230\u6587\u4EF6\u672B\u5C3E"),r.bodyInjected&&this.logger.success("\u6210\u529F\u6CE8\u5165\u5168\u5C40 Loading \u72B6\u6001\u7BA1\u7406\u4EE3\u7801\u5230 HTML \u6587\u4EF6"),r.html},"\u6CE8\u5165\u5168\u5C40 Loading \u72B6\u6001\u7BA1\u7406\u4EE3\u7801")}}const loadingManager=factory_index.createPluginFactory(T);exports.loadingManager=loadingManager;
