# TabBarItem

底部导航项组件，必须作为 [`TabBar`](./tab-bar) 的子组件使用。

## Props

### to

- **类型**: `RouteLocationRaw`
- **必填**: 是
- **说明**: 目标路由位置，支持路径字符串或路由对象，与 `RouterLink` 的 `to` 一致

```vue
<!-- 路径字符串 -->
<TabBarItem to="/pages/index/index" text="首页" />

<!-- 路由对象 -->
<TabBarItem :to="{ name: 'home' }" text="首页" />
```

### text

- **类型**: `string`
- **默认值**: `undefined`
- **说明**: Tab 文字

### iconPath

- **类型**: `string`
- **默认值**: `undefined`
- **说明**: 默认图标路径（相对路径或绝对路径）

### selectedIconPath

- **类型**: `string`
- **默认值**: `undefined`
- **说明**: 选中图标路径，未设置时回退到 `iconPath`

### dot

- **类型**: `boolean`
- **默认值**: `false`
- **说明**: 是否显示图标右上角小红点（优先级高于 `badge`）

### badge

- **类型**: `number | string`
- **默认值**: `undefined`
- **说明**: 图标右上角徽标内容（数字或字符串），为 `0` / 空时不显示

### badgeMax

- **类型**: `number`
- **默认值**: `undefined`
- **说明**: 徽标数字上限，超过时显示 `${max}+`（仅对数字 `badge` 生效）

```vue
<!-- badge=5, badgeMax=3 → 显示 "3+" -->
<TabBarItem to="/pages/msg/msg" text="消息" :badge="5" :badge-max="3" />
```

### badgeColor

- **类型**: `string`
- **默认值**: `undefined`
- **说明**: 徽标背景色，默认使用主题红色 `#ee0a24`

### replace

- **类型**: `boolean`
- **默认值**: `false`
- **说明**: 是否使用替换模式导航（对应 `router.replace`），默认使用 `router.push`

## 插槽

### default

默认插槽，自定义文字内容：

```vue
<TabBarItem to="/pages/index/index" icon-path="/static/home.png">
  <text style="font-weight: bold">首页</text>
</TabBarItem>
```

### icon

自定义图标插槽，接收 `active` 参数：

```vue
<TabBarItem to="/pages/index/index" text="首页">
  <template #icon="{ active }">
    <image :src="active ? '/static/home-active.png' : '/static/home.png'" style="width: 24px; height: 24px" />
  </template>
</TabBarItem>
```

## CSS 自定义属性

| 属性名 | 默认值 | 说明 |
| --- | --- | --- |
| `--mx-tabbar-item-icon-size` | `24px` | 图标尺寸 |
| `--mx-tabbar-item-font-size` | `10px` | 文字字号 |
| `--mx-tabbar-item-gap` | `2px` | 图标与文字间距 |
| `--mx-tabbar-badge-color` | `#ee0a24` | 徽标 / 红点背景色 |
| `--mx-tabbar-badge-dot-size` | `8px` | 红点尺寸 |
| `--mx-tabbar-badge-font-size` | `10px` | 徽标字号 |
| `--mx-tabbar-badge-min-width` | `16px` | 徽标最小宽度 |
| `--mx-tabbar-badge-line-height` | `16px` | 徽标行高 |

覆盖示例：

```css
:root {
  --mx-tabbar-item-icon-size: 28px;
  --mx-tabbar-badge-color: #ff6900;
}
```

## 示例

### 带徽标

```vue
<TabBar>
  <TabBarItem to="/pages/index/index" icon-path="/static/home.png" text="首页" />
  <TabBarItem to="/pages/msg/msg" icon-path="/static/msg.png" text="消息" :badge="3" />
  <TabBarItem to="/pages/user/user" icon-path="/static/user.png" text="我的" dot />
</TabBar>
```

### 自定义图标

```vue
<TabBar>
  <TabBarItem to="/pages/index/index" text="首页">
    <template #icon="{ active }">
      <MyIcon :name="active ? 'home-fill' : 'home'" />
    </template>
  </TabBarItem>
</TabBar>
```

## 下一步

- [TabBar](./tab-bar) — 父容器组件
- [RouterLink](./router-link) — 声明式导航组件
