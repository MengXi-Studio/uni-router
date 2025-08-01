/** 函数式表示法 */
export type RGBColor = `rgb(${number}, ${number}, ${number})`

/** 带透明度 */
export type RGBAColor = `rgba(${number}, ${number}, ${number}, ${number})`

/** 十六进制颜色代码 */
export type HEXColor = `#${string}`

/** 颜色 */
export type Color = RGBColor | RGBAColor | HEXColor | string

/**
 * 窗口动画，详见 [窗口动画](https://uniapp.dcloud.net.cn/api/router.html#animation)
 */
export type AnimationType = 'slide-in-right' | 'slide-in-left' | 'slide-in-top' | 'slide-in-bottom' | 'pop-in' | 'fade-in' | 'zoom-out' | 'zoom-fade-out' | 'none'
