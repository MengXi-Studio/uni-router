---
name: 'md-to-word'
description: '将 Markdown 文件转换为 Word 兼容的 HTML（.doc）文件，保留完整排版格式，同时完美兼容微信公众号平台。当用户要求从 .md 文件创建 .doc 文件或需要 Word 兼容文档输出时触发。'
---

# Markdown 转 Word 文档转换器

将 Markdown（.md）文件转换为 Microsoft Word 兼容的 HTML 文件（.doc 扩展名）。输出为单个自包含的 HTML 文件，Word 可直接打开并保留完整排版格式，同时完美兼容微信公众号平台。

## 触发条件

- 用户要求将 Markdown 文件转换为 Word 文档（.doc）
- 用户要求从 .md 文件创建 .doc 文件
- 用户提到从 Markdown 内容生成 Word 兼容文档

## 工作流程

### 第一步：读取源 Markdown 文件

完整读取指定的 .md 文件，理解其结构和内容。

### 第二步：生成 Word 兼容的 HTML

按照以下严格技术要求创建 .doc 扩展名的 HTML 文件：

#### 2.1 HTML 文档结构

```html
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
	<head>
		<meta charset="utf-8" />
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
		<!--[if gte mso 9]>
			<xml>
				<w:WordDocument>
					<w:View>Print</w:View>
					<w:Zoom>100</w:Zoom>
					<w:DoNotOptimizeForBrowser />
				</w:WordDocument>
			</xml>
		<![endif]-->
		<style>
			/* Word 专用样式（微信会过滤此块，因此每个元素必须有内联 style） */
		</style>
	</head>
	<body>
		/* 内容写在这里，每个元素必须带内联 style 属性 */
	</body>
</html>
```

#### 2.2 核心原则：双保险样式策略

**每个 HTML 元素必须同时具备两种样式来源：**

1. **`<style>` 块中的类样式**：供 Word 使用，确保 Word 中排版完整
2. **元素上的内联 `style` 属性**：供微信使用，当微信过滤掉 `<style>` 块后，内联样式仍能保留

```
错误做法：<h2 class="heading2">标题</h2>
正确做法：<h2 class="heading2" style="font-size:20px;font-weight:bold;color:#1a1a2e;border-bottom:1px solid #e0e0e0;padding-bottom:6px;margin-top:28px;margin-bottom:12px;">标题</h2>
```

**关键：内联 style 属性是微信兼容性的生命线，绝不能省略。**

#### 2.3 必需的样式规范

##### 页面设置

```css
@page {
	size: A4;
	margin: 2.54cm 3.18cm 2.54cm 3.18cm;
}
```

##### 正文样式

| 元素           | 关键样式属性                                                                                                                                                     |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `body`         | `font-family:'Microsoft YaHei',SimSun,Arial,sans-serif; font-size:14px; line-height:1.8; color:#333333;`                                                         |
| `h1`           | `font-size:26px; font-weight:bold; color:#1a1a2e; text-align:center; border-bottom:3px solid #4361ee; padding-bottom:12px; margin-top:20px; margin-bottom:10px;` |
| `h2`           | `font-size:20px; font-weight:bold; color:#1a1a2e; border-bottom:1px solid #e0e0e0; padding-bottom:6px; margin-top:28px; margin-bottom:12px;`                     |
| `h3`           | `font-size:16px; font-weight:bold; color:#2d3748; margin-top:20px; margin-bottom:8px;`                                                                           |
| `h4`           | `font-size:14px; font-weight:bold; color:#4a5568; margin-top:16px; margin-bottom:6px;`                                                                           |
| `p`            | `margin-top:6px; margin-bottom:6px; text-align:justify;`                                                                                                         |
| `blockquote`   | `margin:12px 0; padding:10px 16px; border-left:4px solid #4361ee; background-color:#f7f8fc; color:#555555; font-size:13px;`                                      |
| `code`（行内） | `font-family:Consolas,'Courier New',monospace; background-color:#f0f0f0; padding:1px 5px; border-radius:3px; font-size:13px; color:#e83e8c;`                     |
| `table`        | `border-collapse:collapse; width:100%; margin:12px 0; font-size:13px;`                                                                                           |
| `th`           | `background-color:#4361ee; color:#ffffff; font-weight:bold; padding:8px 12px; border:1px solid #3451d1; text-align:left;`                                        |
| `td`           | `padding:8px 12px; border:1px solid #e0e0e0; vertical-align:top;`                                                                                                |
| `ul, ol`       | `margin:8px 0; padding-left:24px;`                                                                                                                               |
| `li`           | `margin-bottom:4px;`                                                                                                                                             |
| `hr`           | `border:none; border-top:1px solid #e0e0e0; margin:20px 0;`                                                                                                      |

#### 2.4 微信公众号平台兼容性（核心章节）

微信公众号编辑器会对粘贴内容执行三轮清洗：

1. **第一轮**：移除 `<script>`、`<style>`、`<iframe>` 等危险标签及事件属性（`onclick`、`onerror` 等）
2. **第二轮**：标准化结构，将 `<div>` 转为 `<p>`，删除所有 `class` 和大部分 `style`
3. **第三轮**：移动端渲染引擎进一步简化

**必须严格遵循以下规则：**

##### 规则一：每个元素必须有内联 style

微信会过滤 `<style>` 块和 `class` 属性，只有元素上的内联 `style` 属性有机会存活。

```
✗ <p class="intro">段落</p>                          ← class 无效
✗ <p>段落</p>（样式仅在 <style> 块中定义）            ← <style> 被过滤
✓ <p style="font-size:14px;color:#333;">段落</p>     ← 内联样式存活
```

##### 规则二：仅使用微信支持的 CSS 属性

**安全可用：**

- 文字：`font-size`、`color`、`line-height`、`text-align`、`letter-spacing`、`font-weight`、`font-style`、`text-decoration`
- 盒模型：`margin`、`padding`、`border`、`border-radius`、`background`、`background-color`
- 布局：`display`、`width`、`text-align`
- 字体：`font-family`（仅系统字体生效）

**禁止使用：**

- `position: fixed/sticky/absolute` — 被过滤
- `transform` — 被过滤
- `float` — 不稳定，行为不可预测
- `flex` / `grid` — 部分支持但不可靠
- `box-shadow` — 有限支持
- `@media` 查询 — 完全不支持
- CSS 动画 / 过渡 — 完全不支持
- `opacity` — 不稳定
- `overflow` — 不稳定

##### 规则三：仅使用微信支持的 HTML 标签

**安全可用：**

- 文本：`<p>`、`<br>`、`<span>`、`<strong>`、`<b>`、`<em>`、`<i>`、`<u>`、`<s>`、`<del>`
- 标题：`<h1>`~`<h3>`（注意：`<h1>`、`<h2>` 可能被转为 `<p>`，建议用 `<h3>` 或 `<p><strong>` 替代以确保标题样式存活）
- 列表：`<ul>`、`<ol>`、`<li>`（不支持嵌套列表，不支持自定义符号/序号）
- 引用：`<blockquote>`
- 代码：`<code>`、`<pre>`（有限支持，建议用 `<section>` 模拟代码块）
- 表格：`<table>`、`<thead>`、`<tbody>`、`<tr>`、`<th>`、`<td>`
- 容器：`<section>`、`<div>`（`<div>` 可能被转为 `<p>`）
- 图片：`<img>`（必须使用微信图床地址，本地图片需重新上传）
- 链接：`<a>`（仅支持微信公众号文章链接）

**禁止使用：**

- `<script>` — 完全过滤
- `<style>` — 完全过滤（仅作为 Word 降级方案保留）
- `<iframe>` — 完全过滤（腾讯视频除外）
- `<form>` 及表单元素 — 完全过滤
- `<xmp>` — 微信可能过滤，不推荐用于微信场景
- `<meta>`、`<link>` — 完全过滤
- 事件属性（`onclick`、`onload` 等）— 完全过滤

##### 规则四：代码块处理方案

微信对代码块的支持极为有限，`<xmp>` 标签可能被过滤。采用以下方案：

**方案 A：`<section>` 模拟代码块（微信推荐）**

```html
<section
	style="font-family:Consolas,'Courier New',monospace; font-size:12px; line-height:1.6; background-color:#f8f9fa; border:1px solid #e0e0e0; border-radius:4px; padding:12px 16px; margin:10px 0; white-space:pre; overflow-x:auto; color:#333333; display:block;">
	代码内容写在这里（HTML 标签使用全角括号）
</section>
```

**方案 B：`<xmp>` 标签（Word 推荐）**

```html
<xmp
	style="font-family:Consolas,'Courier New',monospace; font-size:12px; line-height:1.6; background-color:#f8f9fa; border:1px solid #e0e0e0; border-radius:4px; padding:12px 16px; margin:10px 0; white-space:pre; color:#333333; display:block;"
>
代码内容写在这里（无需转义）
</xmp>
```

**选择策略：**

- 如果用户明确要求微信兼容：使用方案 A（`<section>`）
- 如果用户仅要求 Word 兼容：使用方案 B（`<xmp>`）
- 如果用户同时要求 Word 和微信兼容：使用方案 A（`<section>`），并在代码内容中将 HTML 标签替换为全角括号

##### 规则五：行内 HTML 标签引用

在正文中提及 HTML 标签时（如"注入到 `<head>` 中"），必须将尖括号替换为全角等价字符：

| 原始写法   | 替换为       |
| ---------- | ------------ |
| `<head>`   | `＜head＞`   |
| `</body>`  | `＜/body＞`  |
| `<script>` | `＜script＞` |
| `<link>`   | `＜link＞`   |
| `<meta>`   | `＜meta＞`   |
| `<style>`  | `＜style＞`  |
| `<div>`    | `＜div＞`    |

**全角尖括号字符：** ＜ (U+FF1C) 和 ＞ (U+FF1E)

##### 规则六：禁止使用 HTML 转义实体

不得使用 `&lt;`、`&gt;`、`&amp;`、`&quot;`、`&nbsp;` 等转义实体。微信可能不解析这些实体，导致显示异常。

##### 规则七：表格兼容性

微信支持 `<table>` 但宽度自适应较差，需注意：

- 表格宽度设为 `width:100%`
- 避免过宽的列，手机端容易横向溢出
- 每个单元格都加内联 `style`
- 避免合并单元格（`colspan`/`rowspan` 不稳定）

##### 规则八：图片兼容性

- 图片必须使用微信图床地址（`https://mmbiz.qpic.cn/...`），本地路径和外部 CDN 均会失效
- 设置 `width` 属性和内联 `style`：`style="width:100%;height:auto;display:block;"`
- 建议图片宽度 ≤ 750px（适配微信标准屏）

##### 规则九：字体兼容性

- 微信不支持 Web Fonts，只能使用系统字体
- 安全字体栈：`-apple-system,BlinkMacSystemFont,'Helvetica Neue','PingFang SC','Microsoft YaHei',SimSun,sans-serif`
- `font-size` 单位必须使用 `px`（微信不解析 `rem`、`em`、`%`）
- 微信默认字号 15px，"大号"约 17px，"小号"约 13px

##### 规则十：列表兼容性

- `<ul>`、`<ol>`、`<li>` 可用，但**不支持嵌套列表**
- 不支持自定义符号样式（微信强制使用默认圆点/数字）
- 如需嵌套列表效果，改用缩进的 `<p>` 模拟

##### 规则十一：标题兼容性

- `<h1>`、`<h2>` 可能被微信转为 `<p>`，丢失标题语义
- **推荐方案**：使用 `<p><strong>` 替代标题标签，确保样式存活：

```html
<p style="font-size:20px;font-weight:bold;color:#1a1a2e;border-bottom:1px solid #e0e0e0;padding-bottom:6px;margin-top:28px;margin-bottom:12px;"><strong>二级标题</strong></p>
```

- 但在 Word 中仍使用 `<h1>`~`<h4>` 标签（配合内联 style），因为 Word 正确支持标题标签

#### 2.5 Markdown 转 HTML 映射规则

| Markdown 元素          | HTML 输出（含内联样式）                                                    |
| ---------------------- | -------------------------------------------------------------------------- |
| `# 一级标题`           | `<h1 style="...">一级标题</h1>`                                            |
| `## 二级标题`          | `<h2 style="...">二级标题</h2>`                                            |
| `### 三级标题`         | `<h3 style="...">三级标题</h3>`                                            |
| `**粗体**`             | `<strong>粗体</strong>`                                                    |
| `*斜体*`               | `<em>斜体</em>`                                                            |
| `` `代码` ``           | `<code style="...">代码</code>`                                            |
| `> 引用`               | `<blockquote style="...">引用</blockquote>`                                |
| 代码块                 | `<section style="...">代码块</section>` 或 `<xmp style="...">代码块</xmp>` |
| 表格                   | `<table style="...">` 配合带内联样式的 `<th>`、`<tr>`、`<td>`              |
| `- 列表项`             | `<ul style="..."><li style="...">列表项</li></ul>`                         |
| `1. 列表项`            | `<ol style="..."><li style="...">列表项</li></ol>`                         |
| `---`                  | `<hr style="...">`                                                         |
| 正文中的 HTML 标签引用 | 全角尖括号：`＜tag＞`                                                      |

#### 2.6 架构图（ASCII 字符画）

源 Markdown 中的 ASCII 字符画图表，使用 `<section>` 包裹并添加内联样式（边框、等宽字体、背景色），确保微信兼容：

```html
<section style="border:1px solid #d0d0d0; padding:12px 16px; margin:10px 0; background-color:#fafbfc; font-family:Consolas,'Courier New',monospace; font-size:12px; line-height:1.5; white-space:pre;">
	┌─────────────┐ │ 架构图内容 │ └─────────────┘
</section>
```

### 第三步：写入输出文件

将生成的 HTML 内容保存为 .doc 文件，放在与源 .md 文件相同的目录下，文件名相同但扩展名为 .doc。

示例：源文件为 `versions/0.1.0.md`，输出为 `versions/0.1.0.doc`。

### 第四步：验证

确认文件创建成功，并总结关键格式化决策。

## 微信兼容性检查清单

生成文件后，逐项检查以下内容：

- [ ] 每个 HTML 元素是否有内联 `style` 属性？
- [ ] 是否使用了微信不支持的 CSS 属性（`position`、`transform`、`float`、`flex`、`grid`、`animation`）？
- [ ] 是否使用了微信不支持的 HTML 标签（`<script>`、`<iframe>`、`<form>`）？
- [ ] 代码块是否使用了 `<section>` 或 `<xmp>` 而非 `<pre><code>`？
- [ ] 行内 HTML 标签引用是否使用了全角尖括号（`＜/＞`）？
- [ ] 是否存在 HTML 转义实体（`&lt;`、`&gt;`、`&amp;`）？
- [ ] 表格宽度是否设为 `100%`？
- [ ] `font-size` 单位是否全部使用 `px`？
- [ ] 是否有嵌套列表（微信不支持）？
- [ ] 图片是否使用了微信图床地址？

## 重要注意事项

- 输出必须是**单个自包含文件**——无外部 CSS、JS 或图片依赖
- **双保险样式策略**：`<style>` 块 + 每个元素的内联 `style`，两者缺一不可
- 文件大小应合理，确保打开速度和编辑性能
- 全角尖括号（＜/＞）是 Unicode 字符，在所有平台上均可正确显示
- 不得在输出文件中添加任何 JavaScript
- 微信的过滤规则可能随版本更新变化，建议定期在微信编辑器中实际测试
