<template>
  <div class="page">
    <div class="hero panel">
      <div>
        <div class="title">测试平台控制台</div>
        <div class="text-muted">统一管理接口、用例、流程与执行结果。</div>
      </div>
      <div class="actions">
        <el-button type="primary" @click="$router.push('/nl')">自然语言录入</el-button>
        <el-button @click="$router.push('/interfaces')">接口管理</el-button>
      </div>
    </div>

    <div class="grid">
      <div class="panel">
        <div class="panel-header">快捷操作</div>
        <div class="panel-body">
          <el-button @click="$router.push('/testcases')">新建用例</el-button>
          <el-button @click="$router.push('/flows')">新建流程</el-button>
          <el-button @click="$router.push('/suite')">运行套件</el-button>
        </div>
      </div>
      <div class="panel">
        <div class="panel-header">最近运行</div>
        <div class="panel-body">
          <div v-if="loading" class="text-muted">加载中...</div>
          <div v-else-if="!runs.length" class="text-muted">暂无运行记录。</div>
          <ul v-else>
            <li v-for="run in runs" :key="run.run_id" class="run-item">
              <span class="mono">{{ run.run_id }}</span>
              <span class="text-muted">{{ run.type === 'flow' ? '流程' : '用例' }}</span>
              <el-button size="small" @click="open(run.run_id, run.type)">查看</el-button>
            </li>
          </ul>
        </div>
      </div>
      <div class="panel">
        <div class="panel-header">环境信息</div>
        <div class="panel-body">
          <div>Base URL: <span class="mono">{{ baseUrl }}</span></div>
          <div class="text-muted">Token：{{ token ? '已登录' : '未登录' }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { listRunRecords } from '../api'

export default {
  name: 'Dashboard',
  computed: {
    token() { return this.$store.state.token },
    baseUrl() { return this.$store.state.baseUrl }
  },
  data() {
    return {
      runs: [],
      loading: false
    }
  },
  mounted() {
    this.fetchRecentRuns()
  },
  methods: {
    async fetchRecentRuns() {
      this.loading = true
      try {
        const res = await listRunRecords({ page: 1, page_size: 10 })
        // 接口返回格式: { items: [...], total, page, page_size }
        this.runs = (res.data.items || []).map(item => ({
          run_id: item.run_id,
          type: item.type,
          start_time: item.start_time
        }))
      } catch (err) {
        console.error('获取最近运行记录失败', err)
        this.runs = []
      } finally {
        this.loading = false
      }
    },
    open(runId, type) {
      this.$router.push({ path: '/results', query: { run_id: runId, type: type } })
    }
  }
}
</script>

<style scoped>
/* 原有样式保持不变 */
.hero {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}
.title {
  font-size: 22px;
  font-weight: 700;
}
.actions {
  display: flex;
  gap: 10px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
}
.run-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
</style>