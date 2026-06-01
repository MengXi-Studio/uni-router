# Changelog

## v0.2.0

### Added

- Route navigation: `push()` / `replace()` / `back()`
- Route guards: `beforeEach` / `beforeResolve` / `afterEach` / `beforeEnter`
- Route meta: `title` / `isTab` / `requireAuth` and custom extension fields
- Composables: `useRouter()` / `useRoute()`
- Error handling: `RouterError` / `NavigationFailure` / `RouterErrorCode`
- Auto-detect TabBar pages and select corresponding uni navigation API
- Guard redirect support (max depth 10)
- Concurrent navigation queue mechanism
- Duplicate navigation detection

### Platform Compatibility

- H5 / iOS / Android / WeChat Mini Program / Alipay Mini Program / Baidu Mini Program / ByteDance Mini Program / QQ Mini Program
