<template>
  <div class="page">
    <div class="panel">
      <div class="panel-header">套件运行</div>
      <div class="panel-body">
        <el-form label-width="120px">
          <el-form-item label="用例ID列表">
            <el-input v-model="caseIdsText" placeholder="20,21,22" />
          </el-form-item>
          <el-form-item label="Host">
            <el-input v-model="payload.host" />
          </el-form-item>
          <el-form-item label="对比Host">
            <el-input v-model="payload.host_compare" />
          </el-form-item>
          <el-form-item label="循环次数">
            <el-input-number v-model="payload.loop_times" :min="1" />
          </el-form-item>
        </el-form>
        <el-button type="primary" v-if="canRun" @click="runSuite">运行</el-button>
        <div v-else class="text-muted">没有运行权限</div>
      </div>
    </div>
  </div>
</template>

<script>
import { runSuite } from '../api'
import { saveRecentRun } from '../utils/export'
import { mapState } from 'vuex'
import { hasPerm } from '../utils/perm'

export default {
  name: 'SuiteRun',
  computed: {
    ...mapState(['user']),
    canRun() {
      return hasPerm(this.user?.permissions, 'run:execute')
    }
  },
  data() {
    return {
      caseIdsText: '20,21,22',
      payload: { host: '', host_compare: '', loop_times: 1 }
    }
  },
  methods: {
    async runSuite() {
      const case_ids = this.caseIdsText.split(',').map(s => parseInt(s.trim(), 10)).filter(Boolean)
      const res = await runSuite({ ...this.payload, case_ids })
      const runId = res.data.run_id || res.data.runId
      saveRecentRun(runId, 'suite')
      this.$router.push({ path: '/results', query: { run_id: runId } })
    }
  }
}
</script>
