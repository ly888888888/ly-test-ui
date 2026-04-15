<template>
  <div class="log panel">
    <div class="panel-header">执行日志</div>
    <div class="panel-body">
      <div v-if="!logs.length" class="text-muted">暂无日志。</div>
      <div v-else class="mono log-body">
        <div v-for="(line, idx) in logs" :key="idx">{{ line }}</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LogPanel',
  props: {
    logs: { type: Array, default: () => [] }
  }
}
</script>

<style scoped>
.log-body {
  max-height: 260px;
  overflow: auto;
  line-height: 1.5;
}
</style>
