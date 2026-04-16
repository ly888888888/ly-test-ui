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
          <div v-if="!runs.length" class="text-muted">暂无运行记录。</div>
          <ul v-else>
            <li v-for="run in runs" :key="run.runId" class="run-item">
              <span class="mono">{{ run.runId }}</span>
              <span class="text-muted">{{ run.type }}</span>
              <el-button size="small" @click="open(run.runId)">查看</el-button>
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
export default {
  name: 'Dashboard',
  computed: {
    token() { return this.$store.state.token },
    baseUrl() { return this.$store.state.baseUrl }
  },
  data() {
    return { runs: [] }
  },
  mounted() {
    const stored = localStorage.getItem('recentRuns')
    let allRuns = stored ? JSON.parse(stored) : []
    // 只展示最近10条（按时间倒序，取前10）
    this.runs = allRuns.slice(0, 10)
  },
  methods: {
    open(runId) {
      this.$router.push({ path: '/results', query: { run_id: runId } })
    }
  }
}
</script>

<style scoped>
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