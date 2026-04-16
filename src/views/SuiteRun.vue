<template>
  <div class="page">
    <div class="panel">
      <div class="panel-header">套件运行</div>
      <div class="panel-body">
        <el-form label-width="120px">
          <el-form-item label="用例ID列表" required>
            <el-input
              v-model="caseIdsText"
              placeholder="请输入用例ID列表，用逗号分隔"
            />
          </el-form-item>
          <el-form-item label="Host" required>
            <el-input v-model="payload.host" placeholder="请输入Host地址" />
          </el-form-item>
          <el-form-item label="对比Host">
            <el-input v-model="payload.host_compare" placeholder="可选" />
          </el-form-item>
          <el-form-item label="循环次数" required>
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
import { ElMessage } from 'element-plus'

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
      caseIdsText: '',
      payload: { host: '', host_compare: '', loop_times: 1 }
    }
  },
  methods: {
    async runSuite() {
      // 1. 校验用例ID列表
      const trimmed = this.caseIdsText.trim()
      if (!trimmed) {
        ElMessage.warning('请输入用例ID列表')
        return
      }
      const case_ids = trimmed
        .split(',')
        .map(s => parseInt(s.trim(), 10))
        .filter(id => !isNaN(id) && id > 0)
      if (case_ids.length === 0) {
        ElMessage.warning('用例ID列表格式错误，请填写有效的数字ID（逗号分隔）')
        return
      }

      // 2. 校验 Host
      if (!this.payload.host || this.payload.host.trim() === '') {
        ElMessage.warning('请输入 Host 地址')
        return
      }

      // 3. 校验循环次数（确保是有效数字且 >=1）
      let loopTimes = this.payload.loop_times
      if (loopTimes === null || loopTimes === undefined || loopTimes < 1) {
        loopTimes = 1
        this.payload.loop_times = 1
      }

      // 准备请求参数
      const requestPayload = {
        ...this.payload,
        case_ids,
        loop_times: loopTimes
      }

      try {
        const res = await runSuite(requestPayload)
        const runId = res.data.run_id || res.data.runId
        saveRecentRun(runId, 'suite')
        this.$router.push({ path: '/results', query: { run_id: runId } })
      } catch (error) {
        const errMsg = error.response?.data?.error || error.message
        ElMessage.error(`运行失败：${errMsg}`)
      }
    }
  }
}
</script>