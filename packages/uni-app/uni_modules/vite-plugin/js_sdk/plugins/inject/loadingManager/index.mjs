import{createPluginFactory as V,BasePlugin as j}from"../../../factory/index.mjs";import{e as G}from"../../../shared/vite-plugin.CuXEJAWX.mjs";import{makeCallback as g}from"../../../common/script/index.mjs";import{validateCallbackFields as J,validateNoScriptInTemplate as z,validateGlobalName as Y}from"../../../common/validation/index.mjs";import{injectHeadAndBody as K}from"../../../common/html/index.mjs";import"../../../logger/index.mjs";import"../../../shared/vite-plugin.DcExl6jd.mjs";import"../../../common/object/index.mjs";const o="__loading-overlay__",c="__loading-hidden__",f="__loading-visible__",H="__loading-top__",F="__loading-center__",A="__loading-bottom__",r="__loading-spinner__",B="__loading-text__",s="__loading-dot__",C="__loading-root__",D="data-loading-text",L="__loading-spin__",M="__loading-dots__",O="__loading-pulse__",N="__loading-bar__",Q={center:F,top:H,bottom:A};function W(e,t="spinner",i){const{overlayColor:n="rgba(255, 255, 255, 0.7)",spinnerColor:l="#4361ee",spinnerSize:d="40px",textColor:a="#333",textSize:u="14px",zIndex:p=9999,pointerEvents:$=!0,backdropBlur:_=!1,backdropBlurAmount:m=4}=e,b=$?"":"pointer-events: none;",v=_?`backdrop-filter: blur(${m}px);-webkit-backdrop-filter: blur(${m}px);`:"",w=Z(t,l,d),T=i?.enabled!==!1,h=i?.duration??200,y=i?.easing??"ease-out",E=T?`transition: opacity ${h}ms ${y}, visibility ${h}ms ${y};`:"";return`
.${o} {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${n};
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: ${p};
  ${b}
  ${v}
  contain: content;
  will-change: opacity;
}
.${o}.${H} {
  justify-content: flex-start;
  padding-top: 60px;
}
.${o}.${F} {
  justify-content: center;
}
.${o}.${A} {
  justify-content: flex-end;
  padding-bottom: 60px;
}
${w}
.${B} {
  margin-top: 12px;
  color: ${a};
  font-size: ${u};
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  user-select: none;
}
.${o}.${c} {
  opacity: 0;
  visibility: hidden;
  ${E}
}
.${o}.${c} .${r},
.${o}.${c} .${s},
.${o}.${c} .${r}::after {
  animation-play-state: paused;
}
.${o}.${f} {
  opacity: 1;
  visibility: visible;
  ${E}
}
.${o}.${f} .${r},
.${o}.${f} .${s},
.${o}.${f} .${r}::after {
  animation-play-state: running;
}`}function Z(e,t,i){switch(e){case"dots":return`
.${r} {
  display: flex;
  gap: 6px;
  align-items: center;
}
.${r} .${s} {
  width: calc(${i} / 4);
  height: calc(${i} / 4);
  border-radius: 50%;
  background: ${t};
  animation: ${M} 1.2s ease-in-out infinite;
}
.${r} .${s}:nth-child(2) { animation-delay: 0.15s; }
.${r} .${s}:nth-child(3) { animation-delay: 0.3s; }
@keyframes ${M} {
  0%, 80%, 100% { transform: scale(0.4); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}`;case"pulse":return`
.${r} {
  width: ${i};
  height: ${i};
  background: ${t};
  border-radius: 50%;
  animation: ${O} 1.2s ease-in-out infinite;
}
@keyframes ${O} {
  0% { transform: scale(0.3); opacity: 0.3; }
  50% { transform: scale(1); opacity: 1; }
  100% { transform: scale(0.3); opacity: 0.3; }
}`;case"bar":return`
.${r} {
  width: calc(${i} * 2.5);
  height: calc(${i} / 5);
  background: rgba(0, 0, 0, 0.08);
  border-radius: calc(${i} / 10);
  overflow: hidden;
  position: relative;
}
.${r}::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 40%;
  background: ${t};
  border-radius: calc(${i} / 10);
  animation: ${N} 1.2s ease-in-out infinite;
}
@keyframes ${N} {
  0% { left: -40%; }
  100% { left: 100%; }
}`;default:return`
.${r} {
  width: ${i};
  height: ${i};
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-top-color: ${t};
  border-radius: 50%;
  animation: ${L} 0.8s linear infinite;
}
@keyframes ${L} {
  to { transform: rotate(360deg); }
}`}}function ee(e){const t=e.position||"center",i=e.defaultText||"\u52A0\u8F7D\u4E2D...",n=e.spinnerType||"spinner",l=Q[t],d=e.style?.customClass?` ${e.style.customClass}`:"",a=e.style?.customStyle?` style="${G(e.style.customStyle)}"`:"",u=e.defaultVisible?f:c;if(e.customTemplate)return`<div class="${o} ${l} ${u}${d}" id="${C}"${a}>${e.customTemplate}</div>`;const p=te(n);return`<div class="${o} ${l} ${u}${d}" id="${C}"${a}>
  ${p}
  <div class="${B}" ${D}>${i}</div>
</div>`}function te(e){switch(e){case"dots":return`<div class="${r}"><div class="${s}"></div><div class="${s}"></div><div class="${s}"></div></div>`;default:return`<div class="${r}"></div>`}}function ie(e){return`  var _loadingEl = null;
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
  var _originalXHRSend = null;`}function ne(e){return`  function _findEl() {
    if (!_loadingEl) {
      _loadingEl = document.getElementById('${C}');
    }
    if (!_textEl && _loadingEl) {
      _textEl = _loadingEl.querySelector('[${D}]');
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
  }`}function oe(){return`  function _applyHide() {
    if (!_loadingEl) return;
    _loadingEl.classList.remove('${f}');
    _loadingEl.classList.add('${c}');
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
    _loadingEl.classList.remove('${c}');
    _loadingEl.classList.add('${f}');
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
  }`}function re(){return`    show: function(text) {
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
    }`}function ae(e){let t="";return(e==="fetch"||e==="all")&&(t+=`  // \u81EA\u52A8\u62E6\u622A fetch
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
`),t.trimEnd()}function le(e,t,i){let n="";return n+=`  // defaultVisible: \u540C\u6B65\u521D\u59CB\u53EF\u89C1\u72B6\u6001
  var _defaultVisible = ${JSON.stringify(e)};
  if (_defaultVisible) {
    _visible = true;
    _showTime = Date.now();
  }
`,e&&t!=="manual"&&(n+=`
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
`),n+=`
  // \u66B4\u9732\u5230\u5168\u5C40
  window['${i}'] = manager;`,n}function ue(e){const t=e.globalName||"__LOADING_MANAGER__",i=e.minDisplayTime||{enabled:!0,duration:300},n=e.delayShow||{enabled:!0,duration:200},l=e.debounceHide||{enabled:!1,duration:100},d=e.transition||{enabled:!0,duration:200,easing:"ease-out"},a=e.autoBind||"none",u=e.requestFilter||{},p=e.defaultVisible||!1,$=e.autoHideOn||"DOMContentLoaded",_=e.callbacks||{},m=u.excludeUrls||[],b=u.includeUrls||[],v=u.excludeMethods||[],w=u.excludeUrlPrefixes||[],T=g(_.onBeforeShow,"loadingManager"),h=g(_.onShow,"loadingManager"),y=g(_.onBeforeHide,"loadingManager"),E=g(_.onHide,"loadingManager"),R=g(_.onDestroy,"loadingManager"),I=ie({minDisplayTime:i,delayShow:n,debounceHide:l,transition:d,excludeUrls:m,includeUrls:b,excludeMethods:v,excludeUrlPrefixes:w,cbBeforeShow:T,cbShow:h,cbBeforeHide:y,cbHide:E,cbDestroy:R}),k=ne(t),U=oe(),P=re(),X=ae(a),q=le(p,$,t);return`(function() {
  'use strict';

  // SSR \u73AF\u5883\u68C0\u6D4B
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

${I}

${k}

${U}

  var manager = {
${P}
  };

${X}

${q}
})();`}function x(e,t){if(e!==void 0&&(typeof e!="number"||e<0))throw new Error(`${t} \u5FC5\u987B\u662F\u975E\u8D1F\u6570`)}function de(e){if(!e)return;const{zIndex:t,pointerEvents:i,backdropBlurAmount:n}=e;if(x(t,"style.zIndex"),i!==void 0&&typeof i!="boolean")throw new Error("style.pointerEvents \u5FC5\u987B\u662F\u5E03\u5C14\u503C");x(n,"style.backdropBlurAmount")}function se(e){if(!e)return;const{duration:t,easing:i}=e;if(x(t,"transition.duration"),i!==void 0&&typeof i!="string")throw new Error("transition.easing \u5FC5\u987B\u662F\u5B57\u7B26\u4E32\u7C7B\u578B")}function _e(e){e&&J(e,["onBeforeShow","onShow","onBeforeHide","onHide","onDestroy"],"callbacks")}function ce(e){return e===""?"defaultText \u4E3A\u7A7A\u5B57\u7B26\u4E32\uFF0Cloading \u5C06\u4E0D\u663E\u793A\u6587\u672C\u5185\u5BB9":null}function fe(e,t){return!e&&t?"autoHideOn \u4EC5\u5728 defaultVisible \u4E3A true \u65F6\u751F\u6548\uFF0C\u5F53\u524D defaultVisible \u4E3A false\uFF0CautoHideOn \u914D\u7F6E\u5C06\u88AB\u5FFD\u7565":null}function S(e,t){if(e?.duration!==void 0&&(typeof e.duration!="number"||e.duration<0))throw new Error(t)}class pe extends j{getDefaultOptions(){return{position:"center",defaultText:"\u52A0\u8F7D\u4E2D...",spinnerType:"spinner",autoBind:"none",globalName:"__LOADING_MANAGER__",defaultVisible:!1,autoHideOn:"DOMContentLoaded",style:{overlayColor:"rgba(255, 255, 255, 0.7)",spinnerColor:"#4361ee",spinnerSize:"40px",textColor:"#333",textSize:"14px",zIndex:9999,pointerEvents:!0,backdropBlur:!1,backdropBlurAmount:4},transition:{enabled:!0,duration:200,easing:"ease-out"},minDisplayTime:{enabled:!0,duration:300},delayShow:{enabled:!0,duration:200},debounceHide:{enabled:!1,duration:100}}}validateOptions(){this.validator.field("position").enum(["center","top","bottom"]).field("defaultText").string().field("spinnerType").enum(["spinner","dots","pulse","bar"]).field("autoBind").enum(["fetch","xhr","all","none"]).field("globalName").string().field("customTemplate").string().field("defaultVisible").boolean().field("autoHideOn").enum(["DOMContentLoaded","load","manual"]).validate(),z(this.options.customTemplate,"customTemplate");const t=ce(this.options.defaultText);t&&this.logger.warn(t),Y(this.options.globalName,"globalName"),de(this.options.style),S(this.options.minDisplayTime,"minDisplayTime.duration \u5FC5\u987B\u662F\u975E\u8D1F\u6570"),S(this.options.delayShow,"delayShow.duration \u5FC5\u987B\u662F\u975E\u8D1F\u6570"),S(this.options.debounceHide,"debounceHide.duration \u5FC5\u987B\u662F\u975E\u8D1F\u6570"),se(this.options.transition),_e(this.options.callbacks);const i=fe(this.options.defaultVisible,this.options.autoHideOn);i&&this.logger.warn(i)}getPluginName(){return"loading-manager"}generateLoadingManager(t){return ue(t)}generateHeadInjectCode(){const{css:t,html:i}=this.getCachedAssets();return`<!-- loading-manager: head start -->
<style data-loading-style data-loading-id="${this.options.globalName||"__LOADING_MANAGER__"}">${t}</style>
${i}
<!-- loading-manager: head end -->`}generateBodyInjectCode(t){const i=this.generateLoadingManager(this.options);if(t)return`<!-- loading-manager: body start -->
<script>${i}<\/script>
<!-- loading-manager: body end -->`;const{css:n,html:l}=this.getCachedAssets();return`<!-- loading-manager: start -->
<script>
(function() {
  // SSR \u73AF\u5883\u68C0\u6D4B
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // \u6CE8\u5165 CSS
  var style = document.createElement('style');
  style.setAttribute('data-loading-style', '');
  style.setAttribute('data-loading-id', '${this.options.globalName||"__LOADING_MANAGER__"}');
  style.textContent = ${JSON.stringify(n)};
  document.head.appendChild(style);

  // \u6CE8\u5165 HTML\uFF08\u7B49\u5F85 body \u53EF\u7528\u65F6\u6267\u884C\uFF09
  function injectHTML() {
    var div = document.createElement('div');
    div.innerHTML = ${JSON.stringify(l)};
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
${i}
<\/script>
<!-- loading-manager: end -->`}_cachedAssets=null;getCachedAssets(){if(!this._cachedAssets){const t=this.options.style||{},i=this.options.spinnerType||"spinner",n=this.options.transition;this._cachedAssets={css:W(t,i,n),html:ee(this.options)}}return this._cachedAssets}addPluginHooks(t){const i=this.options.defaultVisible||!1,n=i?this.generateHeadInjectCode():void 0,l=this.generateBodyInjectCode(i);this.registerTransformIndexHtml(t,d=>{const a=K(d,n,l);return n&&!a.headInjected&&this.logger.warn("\u672A\u627E\u5230 </head> \u6807\u7B7E\uFF0CdefaultVisible \u7684\u767D\u5C4F loading \u5C06\u65E0\u6CD5\u751F\u6548"),a.usedFallback&&this.logger.warn("\u672A\u627E\u5230 </body> \u6216 </html> \u6807\u7B7E\uFF0CLoading \u4EE3\u7801\u8FFD\u52A0\u5230\u6587\u4EF6\u672B\u5C3E"),a.bodyInjected&&this.logger.success("\u6210\u529F\u6CE8\u5165\u5168\u5C40 Loading \u72B6\u6001\u7BA1\u7406\u4EE3\u7801\u5230 HTML \u6587\u4EF6"),a.html},"\u6CE8\u5165\u5168\u5C40 Loading \u72B6\u6001\u7BA1\u7406\u4EE3\u7801")}}const ge=V(pe);export{ge as loadingManager};
