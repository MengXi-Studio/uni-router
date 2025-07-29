import { h } from 'vue'
import { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import TranslationStatus from 'vitepress-translation-helper/ui/TranslationStatus.vue'
import './styles/vars.css'
import status from '../translation-status.json'

const i18nLabels = {
	zh: '该翻译已同步到了 ${date} 的版本，其对应的 commit hash 是 <code>${hash}</code>。'
}

const theme: Theme = {
	extends: DefaultTheme,
	Layout() {
		return h(DefaultTheme.Layout, null, {
			'doc-before': () => h(TranslationStatus, { status, i18nLabels })
		})
	}
}

export default theme
