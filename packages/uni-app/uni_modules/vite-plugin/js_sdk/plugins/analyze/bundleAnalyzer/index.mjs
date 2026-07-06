import{createPluginFactory as x,BasePlugin as b}from"../../../factory/index.mjs";import m from"node:fs";import f from"node:path";import{scanAndMapFiles as v,writeJsonReport as S,writeFileContent as $}from"../../../common/fs/index.mjs";import{normalizePath as w}from"../../../common/path/index.mjs";import{calculateGzipSize as F}from"../../../common/compress/index.mjs";import{formatFileSize as c}from"../../../common/format/index.mjs";import"../../../logger/index.mjs";import"../../../shared/vite-plugin.DcExl6jd.mjs";import"../../../common/object/index.mjs";import"fs";import"path";import"../../../common/concurrency/index.mjs";import"node:zlib";import"node:util";function z(o){return o.includes("node_modules")||o.startsWith("\0")||o.startsWith("virtual:")}async function A(o,s={}){return v(o,{scanOptions:{includeExtensions:s.includeExtensions,excludePatterns:s.excludePatterns},mapFn:e=>e})}function M(o){const s=o.reduce((a,n)=>a+n.size,0),e=new Map;for(const a of o){const n=a.extension||"(no ext)",t=e.get(n)||{count:0,totalSize:0};t.count++,t.totalSize+=a.size,e.set(n,t)}return Array.from(e.entries()).map(([a,{count:n,totalSize:t}])=>({extension:a,count:n,totalSize:t,percentage:s>0?Number((t/s*100).toFixed(1)):0})).sort((a,n)=>n.totalSize-a.totalSize)}function C(o,s){const e=[],a=s*1024;for(const n of o){n.size>a&&e.push({level:"chunk",name:n.name,sizeKB:Number((n.size/1024).toFixed(1)),thresholdKB:s,message:`Chunk "${n.name}" \u8D85\u8FC7\u9608\u503C: ${(n.size/1024).toFixed(1)}KB > ${s}KB`});for(const t of n.modules)t.size>a&&e.push({level:"module",name:t.id,sizeKB:Number((t.size/1024).toFixed(1)),thresholdKB:s,message:`\u6A21\u5757 "${t.id}" \u8D85\u8FC7\u9608\u503C: ${(t.size/1024).toFixed(1)}KB > ${s}KB`})}return e}function k(o,s,e){const a=[];for(const n of o)for(const t of n.modules)e&&t.isNodeModule||a.push(t);return a.sort((n,t)=>t.size-n.size).slice(0,s)}async function B(o,s,e={}){const{gzipSize:a=!0,excludeNodeModules:n=!1}=e,t=[];for(const r of s){const d=f.relative(o,r.filePath),l=w(d),i=r.extension;let u="chunk";i===".html"?u="entry":[".js",".mjs",".cjs",".css",".html"].includes(i)||(u="asset");let h=0;if(a)try{const y=await m.promises.readFile(r.filePath);h=await F(y)}catch{h=0}const p=z(d),g={id:l,size:r.size,gzipSize:h,chunks:[l],imports:[],isEntry:u==="entry",isNodeModule:p};n&&p||t.push({name:l,size:r.size,gzipSize:h,modules:[g],type:u,fileCount:1})}return t.sort((r,d)=>d.size-r.size)}async function D(o,s){const e=Date.now(),a=await A(o,{includeExtensions:s.includeExtensions,excludePatterns:s.excludePatterns}),n=await B(o,a,{gzipSize:s.gzipSize,excludeNodeModules:s.excludeNodeModules}),t=s.excludeNodeModules?a.filter(p=>!z(f.relative(o,p.filePath))):a,r=M(t),d=k(n,s.topModules,s.excludeNodeModules),l=C(n,s.sizeThreshold),i=n.reduce((p,g)=>p+g.size,0),u=n.reduce((p,g)=>p+g.gzipSize,0),h=Date.now()-e;return{timestamp:new Date().toISOString(),totalSize:i,totalGzipSize:u,chunks:n,topModules:d,fileTypeDistribution:r,warnings:l,comparisonDiffs:[],analysisTime:h}}async function E(o){try{const s=f.isAbsolute(o)?o:f.resolve(process.cwd(),o);if(!await m.promises.access(s,m.constants.F_OK).then(()=>!0).catch(()=>!1))return null;const e=await m.promises.readFile(s,"utf-8");return JSON.parse(e)}catch{return null}}function T(o,s){const e=[],a=new Map;for(const t of s.chunks)a.set(t.name,t.size);const n=new Map;for(const t of o.chunks)n.set(t.name,t.size);for(const[t,r]of n){const d=a.get(t);if(d===void 0)e.push({name:t,previousSize:-1,currentSize:r,diff:r,diffPercentage:100,trend:"added"});else{const l=r-d,i=d>0?Number((l/d*100).toFixed(1)):0;e.push({name:t,previousSize:d,currentSize:r,diff:l,diffPercentage:i,trend:l>0?"increased":l<0?"decreased":"unchanged"})}}for(const[t,r]of a)n.has(t)||e.push({name:t,previousSize:r,currentSize:-1,diff:-r,diffPercentage:-100,trend:"removed"});return e.sort((t,r)=>Math.abs(r.diff)-Math.abs(t.diff))}async function R(o,s,e){const a=f.join(o,`${s}.json`),n={timestamp:e.timestamp,summary:{totalSize:e.totalSize,totalGzipSize:e.totalGzipSize,totalSizeFormatted:c(e.totalSize),totalGzipSizeFormatted:c(e.totalGzipSize),chunkCount:e.chunks.length,warningCount:e.warnings.length,analysisTime:e.analysisTime},chunks:e.chunks.map(t=>({name:t.name,size:t.size,sizeFormatted:c(t.size),gzipSize:t.gzipSize,gzipSizeFormatted:c(t.gzipSize),type:t.type,fileCount:t.fileCount,modules:t.modules.map(r=>({id:r.id,size:r.size,sizeFormatted:c(r.size),gzipSize:r.gzipSize,gzipSizeFormatted:c(r.gzipSize),isEntry:r.isEntry,isNodeModule:r.isNodeModule,imports:r.imports}))})),topModules:e.topModules.map(t=>({id:t.id,size:t.size,sizeFormatted:c(t.size),gzipSize:t.gzipSize,gzipSizeFormatted:c(t.gzipSize),isNodeModule:t.isNodeModule})),fileTypeDistribution:e.fileTypeDistribution,warnings:e.warnings,comparisonDiffs:e.comparisonDiffs};return await S(a,n),a}async function P(o,s,e,a={}){const n=f.join(o,`${s}.html`),t=a.defaultChartType||"treemap",r=e.chunks.map(p=>({name:p.name,size:p.size,gzipSize:p.gzipSize,type:p.type})),d=e.fileTypeDistribution,l=e.warnings,i=e.comparisonDiffs,u=e.topModules.slice(0,10),h=O(e,r,d,l,i,u,t);return await $(n,h),n}function O(o,s,e,a,n,t,r){const d=c(o.totalSize),l=c(o.totalGzipSize);return`<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Bundle Analysis Report</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f7fa; color: #333; line-height: 1.6; }
.container { max-width: 1200px; margin: 0 auto; padding: 20px; }
.header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 24px; }
.header h1 { font-size: 24px; margin-bottom: 8px; }
.header .meta { font-size: 14px; opacity: 0.9; }
.summary-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
.card { background: white; border-radius: 10px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.card .label { font-size: 13px; color: #888; margin-bottom: 4px; }
.card .value { font-size: 24px; font-weight: 700; color: #333; }
.card .sub { font-size: 12px; color: #aaa; margin-top: 2px; }
.section { background: white; border-radius: 10px; padding: 24px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.section h2 { font-size: 18px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #f0f0f0; }
.chart-tabs { display: flex; gap: 8px; margin-bottom: 16px; }
.chart-tab { padding: 6px 16px; border: 1px solid #ddd; border-radius: 6px; background: white; cursor: pointer; font-size: 13px; transition: all 0.2s; }
.chart-tab.active { background: #667eea; color: white; border-color: #667eea; }
.chart-container { min-height: 400px; position: relative; }
.treemap { display: flex; flex-wrap: wrap; gap: 2px; }
.treemap-item { border-radius: 4px; padding: 8px; color: white; font-size: 11px; overflow: hidden; display: flex; flex-direction: column; justify-content: center; align-items: center; cursor: pointer; transition: opacity 0.2s; min-width: 40px; min-height: 40px; }
.treemap-item:hover { opacity: 0.85; }
.treemap-item .name { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
.treemap-item .size { font-size: 10px; opacity: 0.9; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #f0f0f0; }
th { background: #fafafa; font-weight: 600; color: #555; position: sticky; top: 0; }
tr:hover { background: #f8f9ff; }
.bar { height: 8px; border-radius: 4px; background: #667eea; transition: width 0.3s; }
.bar-bg { width: 100%; height: 8px; border-radius: 4px; background: #f0f0f0; }
.warning { background: #fff8e1; border-left: 4px solid #ffc107; padding: 12px 16px; border-radius: 0 6px 6px 0; margin-bottom: 8px; font-size: 13px; }
.warning.critical { background: #ffebee; border-left-color: #f44336; }
.diff-positive { color: #f44336; }
.diff-negative { color: #4caf50; }
.diff-added { color: #2196f3; }
.diff-removed { color: #9e9e9e; }
.diff-unchanged { color: #bbb; }
.pie-chart { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }
.pie-svg { flex-shrink: 0; }
.pie-legend { flex: 1; min-width: 200px; }
.legend-item { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; font-size: 13px; }
.legend-color { width: 12px; height: 12px; border-radius: 3px; flex-shrink: 0; }
.empty-state { text-align: center; padding: 40px; color: #aaa; }
@media (max-width: 768px) { .container { padding: 12px; } .summary-cards { grid-template-columns: repeat(2, 1fr); } }
</style>
</head>
<body>
<div class="container">
<div class="header">
<h1>Bundle Analysis Report</h1>
<div class="meta">Generated: ${o.timestamp} | Analysis time: ${o.analysisTime}ms</div>
</div>

<div class="summary-cards">
<div class="card">
<div class="label">Total Size</div>
<div class="value">${d}</div>
<div class="sub">gzip: ${l}</div>
</div>
<div class="card">
<div class="label">Chunks</div>
<div class="value">${o.chunks.length}</div>
<div class="sub">entry: ${o.chunks.filter(i=>i.type==="entry").length} | chunk: ${o.chunks.filter(i=>i.type==="chunk").length} | asset: ${o.chunks.filter(i=>i.type==="asset").length}</div>
</div>
<div class="card">
<div class="label">Warnings</div>
<div class="value">${a.length}</div>
<div class="sub">${a.length>0?"threshold exceeded":"all within limits"}</div>
</div>
<div class="card">
<div class="label">File Types</div>
<div class="value">${e.length}</div>
<div class="sub">extensions detected</div>
</div>
</div>

${a.length>0?`
<div class="section">
<h2>Warnings</h2>
${a.map(i=>`<div class="warning ${i.sizeKB>i.thresholdKB*2?"critical":""}"><strong>${i.level.toUpperCase()}</strong>: ${i.message}</div>`).join("")}
</div>
`:""}

<div class="section">
<h2>Size Distribution</h2>
<div class="chart-tabs">
<button class="chart-tab ${r==="treemap"?"active":""}" onclick="switchChart('treemap')">Treemap</button>
<button class="chart-tab ${r==="sunburst"?"active":""}" onclick="switchChart('sunburst')">Sunburst</button>
<button class="chart-tab ${r==="list"?"active":""}" onclick="switchChart('list')">List</button>
</div>
<div class="chart-container" id="chartContainer"></div>
</div>

<div class="section">
<h2>File Type Distribution</h2>
<div class="pie-chart">
<div class="pie-svg" id="pieChart"></div>
<div class="pie-legend" id="pieLegend"></div>
</div>
</div>

<div class="section">
<h2>Top Modules</h2>
<table>
<thead><tr><th>#</th><th>Module</th><th>Size</th><th>gzip</th><th>Type</th></tr></thead>
<tbody>
${t.map((i,u)=>`<tr><td>${u+1}</td><td title="${i.id}">${i.id.length>60?i.id.slice(0,57)+"...":i.id}</td><td>${c(i.size)}</td><td>${c(i.gzipSize)}</td><td>${i.isNodeModule?"node_modules":"source"}</td></tr>`).join("")}
</tbody>
</table>
</div>

${n.length>0?`
<div class="section">
<h2>Comparison with Previous Build</h2>
<table>
<thead><tr><th>Name</th><th>Previous</th><th>Current</th><th>Diff</th><th>Trend</th></tr></thead>
<tbody>
${n.slice(0,20).map(i=>{const u=i.trend==="increased"?"diff-positive":i.trend==="decreased"?"diff-negative":i.trend==="added"?"diff-added":i.trend==="removed"?"diff-removed":"diff-unchanged",h=i.trend==="increased"?"&#9650;":i.trend==="decreased"?"&#9660;":i.trend==="added"?"&#10010;":i.trend==="removed"?"&#10006;":"&#9644;";return`<tr><td>${i.name}</td><td>${i.previousSize>=0?c(i.previousSize):"-"}</td><td>${i.currentSize>=0?c(i.currentSize):"-"}</td><td class="${u}">${i.diff>=0?"+":""}${c(Math.abs(i.diff))} (${i.diffPercentage}%)</td><td class="${u}">${h} ${i.trend}</td></tr>`}).join("")}
</tbody>
</table>
</div>
`:""}

<div class="section">
<h2>All Chunks</h2>
<table>
<thead><tr><th>Name</th><th>Size</th><th>gzip</th><th>Type</th><th>Proportion</th></tr></thead>
<tbody>
${o.chunks.map(i=>{const u=o.totalSize>0?i.size/o.totalSize*100:0;return`<tr><td title="${i.name}">${i.name.length>50?i.name.slice(0,47)+"...":i.name}</td><td>${c(i.size)}</td><td>${c(i.gzipSize)}</td><td>${i.type}</td><td><div class="bar-bg"><div class="bar" style="width:${u}%"></div></div><span style="font-size:11px;color:#888;">${u.toFixed(1)}%</span></td></tr>`}).join("")}
</tbody>
</table>
</div>
</div>

<script>
const chartData = ${JSON.stringify(s)};
const totalSize = ${o.totalSize};
const distributionData = ${JSON.stringify(e)};
const COLORS = ['#667eea','#764ba2','#f093fb','#f5576c','#4facfe','#00f2fe','#43e97b','#fa709a','#fee140','#a18cd1','#fbc2eb','#a6c1ee','#ffecd2','#fcb69f','#ff9a9e','#fad0c4'];

function switchChart(type) {
	document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
	event.target.classList.add('active');
	renderChart(type);
}

function renderChart(type) {
	const container = document.getElementById('chartContainer');
	if (type === 'treemap') renderTreemap(container);
	else if (type === 'sunburst') renderSunburst(container);
	else renderList(container);
}

function renderTreemap(container) {
	const items = chartData.map((d, i) => {
		const pct = totalSize > 0 ? (d.size / totalSize * 100) : 0;
		const flex = Math.max(pct * 3, 2);
		return '<div class="treemap-item" style="flex:' + flex + ' ' + flex + ' 0;background:' + COLORS[i % COLORS.length] + ';" title="' + d.name + ': ${c(0)}'.replace('0B', formatBytes(d.size)) + '"><span class="name">' + d.name.split('/').pop() + '</span><span class="size">' + formatBytes(d.size) + '</span></div>';
	});
	container.innerHTML = '<div class="treemap">' + items.join('') + '</div>';
}

function renderSunburst(container) {
	const cx = 200, cy = 200, r1 = 80, r2 = 160;
	let paths = '';
	let startAngle = 0;
	const sorted = [...chartData].sort((a, b) => b.size - a.size);
	sorted.forEach((d, i) => {
		const angle = totalSize > 0 ? (d.size / totalSize) * Math.PI * 2 : 0;
		const endAngle = startAngle + angle;
		const x1 = cx + r1 * Math.cos(startAngle);
		const y1 = cy + r1 * Math.sin(startAngle);
		const x2 = cx + r2 * Math.cos(startAngle);
		const y2 = cy + r2 * Math.sin(startAngle);
		const x3 = cx + r2 * Math.cos(endAngle);
		const y3 = cy + r2 * Math.sin(endAngle);
		const x4 = cx + r1 * Math.cos(endAngle);
		const y4 = cy + r1 * Math.sin(endAngle);
		const largeArc = angle > Math.PI ? 1 : 0;
		paths += '<path d="M' + x1 + ',' + y1 + 'L' + x2 + ',' + y2 + 'A' + r2 + ',' + r2 + ' 0 ' + largeArc + ',1 ' + x3 + ',' + y3 + 'L' + x4 + ',' + y4 + 'A' + r1 + ',' + r1 + ' 0 ' + largeArc + ',0 ' + x1 + ',' + y1 + '" fill="' + COLORS[i % COLORS.length] + '" opacity="0.85" style="cursor:pointer" title="' + d.name + ': ' + formatBytes(d.size) + '"/>';
		startAngle = endAngle;
	});
	container.innerHTML = '<div style="text-align:center"><svg width="400" height="400" viewBox="0 0 400 400">' + paths + '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r1 - 1) + '" fill="white"/><text x="' + cx + '" y="' + cy + '" text-anchor="middle" dy="-6" font-size="14" font-weight="600">${d}</text><text x="' + cx + '" y="' + cy + '" text-anchor="middle" dy="14" font-size="11" fill="#888">total</text></svg></div>';
}

function renderList(container) {
	const rows = [...chartData].sort((a, b) => b.size - a.size).map((d, i) => {
		const pct = totalSize > 0 ? (d.size / totalSize * 100).toFixed(1) : '0.0';
		return '<tr><td>' + (i+1) + '</td><td title="' + d.name + '">' + d.name + '</td><td>' + formatBytes(d.size) + '</td><td>' + formatBytes(d.gzipSize) + '</td><td>' + d.type + '</td><td><div class="bar-bg"><div class="bar" style="width:' + pct + '%"></div></div>' + pct + '%</td></tr>';
	});
	container.innerHTML = '<table><thead><tr><th>#</th><th>Name</th><th>Size</th><th>gzip</th><th>Type</th><th>Proportion</th></tr></thead><tbody>' + rows.join('') + '</tbody></table>';
}

function formatBytes(bytes) {
	if (bytes < 1024) return bytes + 'B';
	if (bytes < 1048576) return (bytes / 1024).toFixed(1) + 'KB';
	return (bytes / 1048576).toFixed(2) + 'MB';
}

function renderPieChart() {
	const svg = document.getElementById('pieChart');
	const legend = document.getElementById('pieLegend');
	const cx = 100, cy = 100, r = 90;
	let paths = '';
	let startAngle = -Math.PI / 2;
	const items = distributionData.slice(0, 8);
	const otherPct = distributionData.slice(8).reduce((s, d) => s + d.percentage, 0);
	if (otherPct > 0) items.push({ extension: '(other)', count: 0, totalSize: 0, percentage: otherPct });

	items.forEach((d, i) => {
		const angle = (d.percentage / 100) * Math.PI * 2;
		const endAngle = startAngle + angle;
		const x1 = cx + r * Math.cos(startAngle);
		const y1 = cy + r * Math.sin(startAngle);
		const x2 = cx + r * Math.cos(endAngle);
		const y2 = cy + r * Math.sin(endAngle);
		const largeArc = angle > Math.PI ? 1 : 0;
		paths += '<path d="M' + cx + ',' + cy + 'L' + x1 + ',' + y1 + 'A' + r + ',' + r + ' 0 ' + largeArc + ',1 ' + x2 + ',' + y2 + 'Z" fill="' + COLORS[i % COLORS.length] + '" opacity="0.85"/>';
		startAngle = endAngle;
	});

	svg.innerHTML = '<svg width="200" height="200" viewBox="0 0 200 200">' + paths + '</svg>';
	legend.innerHTML = items.map((d, i) => '<div class="legend-item"><div class="legend-color" style="background:' + COLORS[i % COLORS.length] + '"></div><span>' + d.extension + ' (' + d.percentage.toFixed(1) + '%)</span></div>').join('');
}

renderChart('${r}');
renderPieChart();
<\/script>
</body>
</html>`}class N extends b{analysisResult=null;getDefaultOptions(){return{outputFormat:"json",outputFile:"bundle-analysis",openAnalyzer:!1,sizeThreshold:100,topModules:20,compareWith:null,gzipSize:!0,excludeNodeModules:!1,excludePatterns:[],includeExtensions:[],defaultChartType:"treemap"}}validateOptions(){this.validator.field("outputFormat").enum(["json","html","both"]).field("openAnalyzer").boolean().field("sizeThreshold").number().minValue(0).field("topModules").number().minValue(1).field("gzipSize").boolean().field("excludeNodeModules").boolean().field("defaultChartType").enum(["treemap","sunburst","list"]).validate()}getPluginName(){return"bundle-analyzer"}getEnforce(){return"post"}addPluginHooks(s){this.registerOrderedHook(s,"writeBundle",()=>this.runAnalysis(),"\u5206\u6790\u6784\u5EFA\u4EA7\u7269","post")}async runAnalysis(){if(!this.viteConfig)return;const s=this.viteConfig.build.outDir;this.analysisResult=await D(s,this.options),this.options.compareWith&&await this.performComparison(),this.logSummary(),this.logWarnings(),await this.generateReports(s),this.options.openAnalyzer&&(this.options.outputFormat==="html"||this.options.outputFormat==="both")&&await this.openHtmlReport(s)}async performComparison(){if(!this.analysisResult||!this.options.compareWith)return;const s=await E(this.options.compareWith);if(!s){this.logger.info(`\u672A\u627E\u5230\u5BF9\u6BD4\u62A5\u544A: ${this.options.compareWith}\uFF0C\u8DF3\u8FC7\u5BF9\u6BD4\u5206\u6790`);return}const e=T(this.analysisResult,s);if(this.analysisResult.comparisonDiffs=e,e.length>0){const a=e.filter(d=>d.trend==="increased").length,n=e.filter(d=>d.trend==="decreased").length,t=e.filter(d=>d.trend==="added").length,r=e.filter(d=>d.trend==="removed").length;this.logger.info(`\u6784\u5EFA\u5BF9\u6BD4: ${a} \u4E2A\u589E\u5927, ${n} \u4E2A\u51CF\u5C0F, ${t} \u4E2A\u65B0\u589E, ${r} \u4E2A\u79FB\u9664`)}}async generateReports(s){if(!this.analysisResult)return;const{outputFormat:e,outputFile:a}=this.options;if(e==="json"||e==="both"){const n=await R(s,a,this.analysisResult);this.logger.info(`JSON \u62A5\u544A\u5DF2\u751F\u6210: ${n}`)}if(e==="html"||e==="both"){const n=await P(s,a,this.analysisResult,{defaultChartType:this.options.defaultChartType});this.logger.info(`HTML \u62A5\u544A\u5DF2\u751F\u6210: ${n}`)}}async openHtmlReport(s){const e=`${s}/${this.options.outputFile}.html`;try{const{exec:a}=await import("node:child_process"),n=process.platform;a(n==="win32"?`start "" "${e}"`:n==="darwin"?`open "${e}"`:`xdg-open "${e}"`),this.logger.info(`\u5DF2\u5728\u6D4F\u89C8\u5668\u4E2D\u6253\u5F00\u62A5\u544A: ${e}`)}catch{this.logger.warn(`\u65E0\u6CD5\u81EA\u52A8\u6253\u5F00\u6D4F\u89C8\u5668\uFF0C\u8BF7\u624B\u52A8\u6253\u5F00: ${e}`)}}logSummary(){if(!this.analysisResult)return;const{chunks:s,totalSize:e,totalGzipSize:a,analysisTime:n}=this.analysisResult;this.logger.success(`\u4EA7\u7269\u5206\u6790\u5B8C\u6210: ${s.length} \u4E2A chunk, \u603B\u4F53\u79EF: ${c(e)} (gzip: ${c(a)}), \u5206\u6790\u8017\u65F6: ${n}ms`);const t=s.filter(l=>l.type==="entry").length,r=s.filter(l=>l.type==="chunk").length,d=s.filter(l=>l.type==="asset").length;if((t>0||r>0||d>0)&&this.logger.info(`  \u5165\u53E3: ${t} | \u4EE3\u7801\u5757: ${r} | \u8D44\u6E90: ${d}`),this.analysisResult.topModules.length>0){this.logger.info("\u4F53\u79EF Top 5 \u6A21\u5757:");const l=this.analysisResult.topModules.slice(0,5);for(let i=0;i<l.length;i++){const u=l[i],h=u.isNodeModule?"node_modules":"source";this.logger.info(`  ${i+1}. ${c(u.size)} (${h}) ${u.id}`)}}}logWarnings(){if(!(!this.analysisResult||this.analysisResult.warnings.length===0)){this.logger.warn(`\u53D1\u73B0 ${this.analysisResult.warnings.length} \u4E2A\u4F53\u79EF\u544A\u8B66:`);for(const s of this.analysisResult.warnings){const e=s.sizeKB>s.thresholdKB*2?"\u{1F534}":"\u{1F7E1}";this.logger.warn(`  ${e} ${s.message}`)}}}getResult(){return this.analysisResult}}const L=x(N);export{L as bundleAnalyzer};
