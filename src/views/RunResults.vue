<template>
  <div class="page">
    <div class="panel">
      <div class="panel-header">运行结果</div>
      <div class="panel-body">
        <div class="toolbar">
          <el-input v-model="runId" placeholder="运行ID" />
          <el-select v-model="type" placeholder="类型" style="width:140px">
            <el-option label="用例" value="testcase" />
            <el-option label="流程" value="flow" />
          </el-select>
          <el-button type="primary" v-if="canRead" @click="fetchResult">查询</el-button>
          <el-button v-if="canRead" @click="toggleAuto">{{ auto ? '停止自动' : '自动刷新' }}</el-button>
          <div v-else class="text-muted">没有查看运行结果的权限</div>
        </div>

        <el-alert v-if="error" type="error" :title="error" show-icon />

        <div v-if="result" class="result">
          <pre class="mono">{{ result }}</pre>
        </div>
      </div>
    </div>

    <LogPanel :logs="logs" />
  </div>
</template>

<script>
import { getRunResults, getFlowResults } from '../api'
import LogPanel from '../components/LogPanel.vue'
import { mapState } from 'vuex'
import { hasPerm } from '../utils/perm'

export default {
  name: 'RunResults',
  components: { LogPanel },
  computed: {
    ...mapState(['user']),
    canRead() {
      return hasPerm(this.user?.permissions, 'run:read')
    }
  },
  data() {
    return {
      runId: this.$route.query.run_id || '',
      type: this.$route.query.type || 'testcase',
      result: '',
      error: '',
      logs: [],
      auto: false
    }
  },
  beforeUnmount() {
    clearInterval(this.timer)
  },
  methods: {
    async fetchResult() {
      if (!this.runId) return
      this.error = ''
      try {
        const res = this.type === 'flow'
          ? await getFlowResults(this.runId)
          : await getRunResults(this.runId)
        this.result = JSON.stringify(res.data, null, 2)
        this.logs.push(`[${new Date().toLocaleTimeString()}] 拉取 ${this.runId}`)
      } catch (e) {
        this.error = e.response?.data?.error || e.message
      }
    },
    toggleAuto() {
      this.auto = !this.auto
      if (this.auto) {
        this.fetchResult()
        this.timer = setInterval(this.fetchResult, 5000)
      } else {
        clearInterval(this.timer)
      }
    }
  }
}
</script>

<style scoped>
.toolbar {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.result {
  background: var(--panel-2);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px;
  max-height: 420px;
  overflow: auto;
}
</style>
