<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

const { lang } = useData()

const isZh = computed(() => lang.value.startsWith('zh'))

const npmUrl = 'https://www.npmjs.com/package/@meng-xi/uni-router'
const githubUrl = 'https://github.com/MengXi-Studio/uni-router'
</script>

<template>
  <div class="home-badges">
    <a :href="npmUrl" target="_blank" rel="noopener">
      <img
        :alt="isZh ? 'npm 版本' : 'npm version'"
        src="https://img.shields.io/npm/v/@meng-xi/uni-router.svg?style=flat-square&color=42b883"
      />
    </a>
    <a :href="npmUrl" target="_blank" rel="noopener">
      <img
        :alt="isZh ? 'npm 下载量' : 'npm downloads'"
        src="https://img.shields.io/npm/dm/@meng-xi/uni-router.svg?style=flat-square&color=35495e"
      />
    </a>
    <a :href="githubUrl" target="_blank" rel="noopener">
      <img
        :alt="isZh ? 'GitHub stars' : 'GitHub stars'"
        src="https://img.shields.io/github/stars/MengXi-Studio/uni-router.svg?style=flat-square&color=42b883"
      />
    </a>
    <a :href="githubUrl" target="_blank" rel="noopener">
      <img
        :alt="isZh ? 'GitHub license' : 'GitHub license'"
        src="https://img.shields.io/github/license/MengXi-Studio/uni-router.svg?style=flat-square&color=35495e"
      />
    </a>
  </div>
</template>

<style scoped>
.home-badges {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 24px;
  margin-bottom: 8px;
}

.home-badges img {
  height: 20px;
  vertical-align: middle;
  transition: opacity 0.2s;
}

.home-badges a:hover img {
  opacity: 0.85;
}
</style>
