# TabBarItem

Bottom navigation item component, must be used as a child of [`TabBar`](./tab-bar).

## Props

### to

- **Type**: `RouteLocationRaw`
- **Required**: Yes
- **Description**: Target route location, supports path string or route object, same as `RouterLink`'s `to`

```vue
<!-- Path string -->
<TabBarItem to="/pages/index/index" text="Home" />

<!-- Route object -->
<TabBarItem :to="{ name: 'home' }" text="Home" />
```

### text

- **Type**: `string`
- **Default**: `undefined`
- **Description**: Tab text

### iconPath

- **Type**: `string`
- **Default**: `undefined`
- **Description**: Default icon path (relative or absolute)

### selectedIconPath

- **Type**: `string`
- **Default**: `undefined`
- **Description**: Selected icon path, falls back to `iconPath` when not set

### dot

- **Type**: `boolean`
- **Default**: `false`
- **Description**: Whether to show a small red dot on the top right of the icon (takes priority over `badge`)

### badge

- **Type**: `number | string`
- **Default**: `undefined`
- **Description**: Badge content on the top right of the icon (number or string), hidden when `0` or empty

### badgeMax

- **Type**: `number`
- **Default**: `undefined`
- **Description**: Badge number cap, displays `${max}+` when exceeded (only for number `badge`)

```vue
<!-- badge=5, badgeMax=3 → shows "3+" -->
<TabBarItem to="/pages/msg/msg" text="Messages" :badge="5" :badge-max="3" />
```

### badgeColor

- **Type**: `string`
- **Default**: `undefined`
- **Description**: Badge background color, defaults to theme red `#ee0a24`

### replace

- **Type**: `boolean`
- **Default**: `false`
- **Description**: Whether to use replace mode navigation (`router.replace`), defaults to `router.push`

## Slots

### default

Default slot for custom text content:

```vue
<TabBarItem to="/pages/index/index" icon-path="/static/home.png">
  <text style="font-weight: bold">Home</text>
</TabBarItem>
```

### icon

Custom icon slot, receives `active` parameter:

```vue
<TabBarItem to="/pages/index/index" text="Home">
  <template #icon="{ active }">
    <image :src="active ? '/static/home-active.png' : '/static/home.png'" style="width: 24px; height: 24px" />
  </template>
</TabBarItem>
```

## CSS Custom Properties

| Property | Default | Description |
| --- | --- | --- |
| `--mx-tabbar-item-icon-size` | `24px` | Icon size |
| `--mx-tabbar-item-font-size` | `10px` | Text font size |
| `--mx-tabbar-item-gap` | `2px` | Gap between icon and text |
| `--mx-tabbar-badge-color` | `#ee0a24` | Badge / dot background color |
| `--mx-tabbar-badge-dot-size` | `8px` | Dot size |
| `--mx-tabbar-badge-font-size` | `10px` | Badge font size |
| `--mx-tabbar-badge-min-width` | `16px` | Badge minimum width |

Override example:

```css
:root {
  --mx-tabbar-item-icon-size: 28px;
  --mx-tabbar-badge-color: #ff6900;
}
```

## Examples

### With Badge

```vue
<TabBar>
  <TabBarItem to="/pages/index/index" icon-path="/static/home.png" text="Home" />
  <TabBarItem to="/pages/msg/msg" icon-path="/static/msg.png" text="Messages" :badge="3" />
  <TabBarItem to="/pages/user/user" icon-path="/static/user.png" text="Profile" dot />
</TabBar>
```

### Custom Icon

```vue
<TabBar>
  <TabBarItem to="/pages/index/index" text="Home">
    <template #icon="{ active }">
      <MyIcon :name="active ? 'home-fill' : 'home'" />
    </template>
  </TabBarItem>
</TabBar>
```

## Next Steps

- [TabBar](./tab-bar) — Parent container component
- [RouterLink](./router-link) — Declarative navigation component
