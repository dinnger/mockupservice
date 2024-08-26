<template>
<div style="height:100%">
  <n-config-provider preflight-style-disabled :locale="esAR" :date-locale="dateEsAR" :hljs="hljs" style="height: 100%;"
    :theme="lightTheme">
    <n-notification-provider placement="bottom-right">
      <HelloWorld :socket="socket"/>
    </n-notification-provider>
  </n-config-provider>
</div>
</template>

<script setup>
import { io } from 'socket.io-client'
import { esAR, dateEsAR, lightTheme } from 'naive-ui'
import hljs from 'highlight.js'
import markdown from 'highlight.js/lib/languages/markdown'
import HelloWorld from './components/HelloWorld.vue'

hljs.registerLanguage('markdown', markdown)

const url = window.location.origin
const path = window.location.pathname
console.log('url', url)
const socket = io(url, { path: path + 'socket.io' })
</script>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
