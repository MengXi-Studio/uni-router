# usePageChannel()

Gets the bidirectional communication channel between the current page and the navigation initiator. Must be called inside a Vue component's `setup()` function.

::: tip Prerequisite
Requires enabling the built-in communication manager via `createRouter({ useUniEventChannel: true })`. In default mode (`useUniEventChannel: false`), it always returns a no-op channel—calling `on` / `emit` has no effect.
:::

## Type

```ts
function usePageChannel(): EventChannel
```

## Return Value

Returns an [`EventChannel`](https://uniapp.dcloud.net.cn/api/router.html#navigateto) instance with the following methods:

| Method | Description |
| --- | --- |
| `on(event, callback)` | Listen for events from the navigation initiator |
| `once(event, callback)` | Listen for an event once; auto-removed after firing |
| `off(event, callback?)` | Remove event listener(s) |
| `emit(event, ...args)` | Send an event to the navigation initiator |

- Returns a shared `UniEventChannel` instance when `__nav_id` is present
- Returns a `noopChannel` when `__nav_id` is absent (no-op, avoids null checks)
- Automatically destroys the channel and cleans up all listeners on page unmount

## How It Works

`usePageChannel()` reads `route.params.__navId` internally:

```
Navigation initiator push/replace/relaunch
  → Generates a unique navId (e.g., nav-1700000000000-1)
  → Creates a UniEventChannel and registers it in the channel registry
  → __nav_id is injected into URL query for persistence (survives H5 refresh)

Target page usePageChannel()
  → Reads navId from route.params.__navId
  → Gets the registered channel from the registry (reused)
  → Channel is destroyed on page unmount
```

Event names are isolated via the `uni-router:<navId>:<event>` format, communicating over the `uni.$emit` / `uni.$on` global event bus to ensure events from different navigations don't interfere.

::: tip Sticky Event Caching
The built-in channel implements a sticky event mechanism: `emit` **always** caches the event arguments; when `on` / `once` registers a listener and a cache exists, it **async-triggers** the listener (without deleting the cache).

This solves the timing race between the initiator's `emit` and the target page's `setup` listener registration—regardless of the order of `emit` and `on`, all listeners receive the data from the last `emit`.
:::

## Calling Constraints

::: warning Must be called inside setup
`usePageChannel()` depends on `useRouter()` (which internally uses Vue's `inject`), so it can only be called inside a component's `setup()` function (or `<script setup>`).
:::

## Examples

### Basic Usage

```vue
<script setup lang="ts">
import { usePageChannel } from '@meng-xi/uni-router'

const channel = usePageChannel()

// Listen for events from the initiator
channel.on('init', (data) => {
  console.log('Received init data:', data)
})

// Send an event to the initiator
channel.emit('ready', { status: 'loaded' })
</script>
```

### Bidirectional Communication with push

```ts
// Initiating page
import { useRouter } from '@meng-xi/uni-router'

const router = useRouter()

const { eventChannel } = await router.push({
  name: 'detail',
  params: { id: 123 },
  events: {
    // Listen for events from the target page
    ready(data) { console.log('Target page ready:', data) }
  }
})

// Send an event to the target page
eventChannel.emit('init', { message: 'Init data' })
```

```vue
<!-- Target page detail.vue -->
<script setup lang="ts">
import { usePageChannel } from '@meng-xi/uni-router'

const channel = usePageChannel()

// Listen for events from the initiator
channel.on('init', (data) => {
  console.log('Received init:', data)
})

// Notify the initiator that the page is ready
channel.emit('ready', { status: 'loaded' })
</script>
```

### replace / relaunch Also Support Communication

With `useUniEventChannel` enabled, `replace` / `relaunch` also return `eventChannel`:

```ts
// Communicate with the target page even after replace
const { eventChannel } = await router.replace({
  name: 'detail',
  params: { id: 123 }
})

eventChannel.emit('init', { source: 'replace' })
```

### One-time Listening

```ts
const channel = usePageChannel()

// once fires only once—ideal for "initialize once" scenarios
channel.once('init', (data) => {
  console.log('Received once:', data)
})
```

::: tip once and Sticky Cache
Even if `emit` happens before `once` is registered (initiator emits first, target registers once later), `once` still receives the data via the cache. The cache is not deleted, so subsequent `on` registrations also receive it.
:::

## Differences from Native getOpenerEventChannel

| Feature | Native `getOpenerEventChannel()` | `usePageChannel()` |
| --- | --- | --- |
| Applicable navigation methods | Only `push` (`navigateTo`) | All methods (`push` / `replace` / `relaunch`) |
| Timing issues | Events lost when emit precedes on | Sticky cache, no loss |
| Usage | `getCurrentPages()[last].getOpenerEventChannel()` | Direct call, auto-bound |
| Lifecycle cleanup | Manual | Auto-destroyed on page unmount |
| H5 refresh | Channel lost | `__nav_id` persisted, can rebuild |
| Prerequisite | None | Requires `useUniEventChannel: true` |

## Next Steps

- [RouterOptions](./type-router-options) — See the `useUniEventChannel` option
- [Composables Guide](../guide/composables) — In-depth usage of composables
- [Navigation - Page Communication](../guide/navigation#special-usage-page-communication) — Communication mechanism details
