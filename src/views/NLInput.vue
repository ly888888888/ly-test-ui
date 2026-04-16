<template>
  <div class="page">
    <div class="panel">
      <div class="panel-header">自然语言录入</div>
      <div class="panel-body">
        <el-tabs v-model="activeTab" class="nl-tabs">
          <el-tab-pane label="创建用例" name="case" />
          <el-tab-pane label="创建流程" name="flow" />
        </el-tabs>
        <div class="grid">
          <div class="left">
            <el-input v-model="inputValue" type="textarea" :rows="16" placeholder="在此粘贴自然语言接口描述" />
            <div class="actions">
              <el-button type="primary" @click="parse">解析</el-button>
              <el-button @click="loadSample">加载示例</el-button>
              <el-button @click="clearAll">清空</el-button>
            </div>
          </div>
          <div class="right">
            <template v-if="activeTab === 'case'">
              <div class="panel mini">
                <div class="panel-header">解析后的接口</div>
                <div class="panel-body">
                  <el-input v-model="interfaceText" type="textarea" :rows="8" class="mono" />
                  <el-button type="success" size="small" @click="createInterface" :disabled="!canInterfaceWrite || !interfaceText">创建接口</el-button>
                </div>
              </div>
              <div class="panel mini">
                <div class="panel-header">解析后的用例</div>
                <div class="panel-body">
                  <el-input v-model="testcasesText" type="textarea" :rows="8" class="mono" />
                  <el-button type="success" size="small" @click="createTestcases" :disabled="!canTestcaseWrite || !testcasesText">创建用例</el-button>
                </div>
              </div>
            </template>
            <template v-else>
              <div class="panel mini">
                <div class="panel-header">解析后的流程</div>
                <div class="panel-body">
                  <el-input v-model="flowText" type="textarea" :rows="8" class="mono" />
                  <el-button type="success" size="small" @click="createFlow" :disabled="!canFlowWrite || !flowText">创建流程</el-button>
                </div>
              </div>
            </template>
          </div>
        </div>
        <div class="text-muted">示例来自 public/nl_samples.txt</div>
      </div>
    </div>
  </div>

  <el-dialog v-model="errorVisible" title="输入格式不正确" width="60%">
    <div class="error-block">{{ errorMsg }}</div>
    <pre class="mono help-pre">{{ errorExample }}</pre>
    <template #footer>
      <el-button type="primary" @click="errorVisible = false">知道了</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="sampleVisible" :title="sampleTitle" width="60%">
    <el-input v-model="sampleText" type="textarea" :rows="18" class="mono" />
    <template #footer>
      <el-button @click="sampleVisible = false">关闭</el-button>
      <el-button type="primary" @click="copySample">一键复制</el-button>
    </template>
  </el-dialog>
</template>

<script>
import { parseNL } from '../utils/nlParser'
import { createInterface, createTestcase, createFlow, generateFromNL } from '../api'
import { mapState } from 'vuex'
import { hasPerm } from '../utils/perm'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'NLInput',
  computed: {
    ...mapState(['user', 'baseUrl']),
    canInterfaceWrite() {
      return hasPerm(this.user?.permissions, 'interface:write')
    },
    canTestcaseWrite() {
      return hasPerm(this.user?.permissions, 'testcase:write')
    },
    canFlowWrite() {
      return hasPerm(this.user?.permissions, 'flow:write')
    },
    inputValue: {
      get() {
        return this.activeTab === 'flow' ? this.inputFlow : this.inputCase
      },
      set(val) {
        if (this.activeTab === 'flow') {
          this.inputFlow = val
        } else {
          this.inputCase = val
        }
      }
    }
  },
  data() {
    return {
      activeTab: 'case',
      inputCase: '',
      inputFlow: '',
      interfaceText: '',
      testcasesText: '',
      flowText: '',
      errorVisible: false,
      errorMsg: '',
      errorExample: '',
      sampleVisible: false,
      sampleText: '',
      sampleTitle: '',
      sampleCacheCase: '',
      sampleCacheFlow: ''
    }
  },
  methods: {
    isFlowInput(text) {
      return /测试流程|多步流程|流程步骤/.test(text) || /\d+(?:\.\d+)?\)\s*(GET|POST|PUT|DELETE)\s+/i.test(text)
    },
    isCaseInput(text) {
      return /(新接口|我现在有个接口|请求路由和参数|接口请求返回结果|返回结果)/.test(text)
    },
    async fetchSampleText(kind) {
      if (kind === 'flow') {
        if (this.sampleCacheFlow) return this.sampleCacheFlow
        const res = await fetch('/nl_samples_flows.txt')
        this.sampleCacheFlow = await res.text()
        return this.sampleCacheFlow
      }
      if (this.sampleCacheCase) return this.sampleCacheCase
      const res = await fetch('/nl_samples_cases.txt')
      this.sampleCacheCase = await res.text()
      return this.sampleCacheCase
    },
    async loadSample() {
      const isFlow = this.activeTab === 'flow'
      this.sampleText = await this.fetchSampleText(isFlow ? 'flow' : 'case')
      this.sampleTitle = isFlow ? '流程示例' : '用例示例'
      this.sampleVisible = true
    },
    clearAll() {
      if (this.activeTab === 'flow') {
        this.inputFlow = ''
      } else {
        this.inputCase = ''
      }
      this.interfaceText = ''
      this.testcasesText = ''
      this.flowText = ''
    },
    async parse() {
      this.interfaceText = ''
      this.testcasesText = ''
      this.flowText = ''

      const text = this.inputValue || ''
      const flowLike = this.isFlowInput(text)
      const caseLike = this.isCaseInput(text)
      if (this.activeTab === 'flow' && caseLike && !flowLike) {
        this.errorMsg = '当前是创建流程模式，请输入流程格式（包含步骤1) GET/POST 等）。'
        this.errorExample = await this.fetchSampleText('flow')
        this.errorVisible = true
        return
      }
      if (this.activeTab === 'case' && flowLike) {
        this.errorMsg = '当前是创建用例模式，请输入接口用例格式（包含请求路由和返回结果）。'
        this.errorExample = await this.fetchSampleText('case')
        this.errorVisible = true
        return
      }

      try {
        const res = await generateFromNL({ text: this.inputValue, base_url: this.baseUrl || undefined })
        const { interfacePayload, testcases, flowPayload } = res.data
        this.interfaceText = interfacePayload ? JSON.stringify(interfacePayload, null, 2) : ''
        this.testcasesText = (testcases && testcases.length) ? JSON.stringify(testcases, null, 2) : ''
        this.flowText = flowPayload ? JSON.stringify(flowPayload, null, 2) : ''
      } catch (e) {
        const err = e.response?.data
        // 处理项目不存在或禁用的错误
        if (err?.code === 'PROJECT_NOT_FOUND') {
          this.$message.error(err.error)
          this.$confirm('是否立即创建该项目？', '提示', {
            confirmButtonText: '去创建',
            cancelButtonText: '取消',
            type: 'warning'
          }).then(() => {
            this.$router.push('/projects')
          }).catch(() => {})
          return
        }
        if (err?.code === 'PROJECT_DISABLED') {
          this.$message.error(err.error)
          return
        }
        // 其他格式错误
        if (err?.error) {
          this.errorMsg = err.error
          const kind = this.activeTab === 'flow' ? 'flow' : 'case'
          try {
            this.errorExample = await this.fetchSampleText(kind)
          } catch {
            this.errorExample = err.expected || ''
          }
          this.errorVisible = true
          return
        }
        // fallback 本地解析
        const { interfacePayload, testcases } = parseNL(this.inputValue)
        this.interfaceText = interfacePayload ? JSON.stringify(interfacePayload, null, 2) : ''
        this.testcasesText = (testcases && testcases.length) ? JSON.stringify(testcases, null, 2) : ''
        this.flowText = ''
      }
    },
    async createInterface() {
      try {
        const payload = JSON.parse(this.interfaceText)
        await createInterface(payload)
        ElMessage.success('接口创建成功')
      } catch (e) {
        const errMsg = e.response?.data?.error || e.message
        if (errMsg.includes('项目') && (errMsg.includes('不存在') || errMsg.includes('禁用'))) {
          ElMessage.error(errMsg + '，请先到项目管理中创建或启用该项目')
        } else {
          ElMessage.error('接口创建失败：' + errMsg)
        }
      }
    },
    async createTestcases() {
      let testcases
      try {
        testcases = JSON.parse(this.testcasesText)
      } catch (e) {
        ElMessage.error('用例 JSON 格式错误，请检查')
        return
      }
      if (!Array.isArray(testcases) || testcases.length === 0) {
        ElMessage.warning('没有可创建的用例')
        return
      }

      let successCount = 0
      let failCount = 0
      let firstError = null

      for (let i = 0; i < testcases.length; i++) {
        const tc = testcases[i]
        try {
          await createTestcase(tc)
          successCount++
        } catch (error) {
          failCount++
          const errMsg = error.response?.data?.error || error.message
          if (!firstError) {
            firstError = { index: i, name: tc.name || `用例${i+1}`, msg: errMsg }
          }
        }
      }

      if (failCount === 0) {
        ElMessage.success(`成功创建 ${successCount} 个用例`)
        this.testcasesText = ''
      } else {
        if (firstError && firstError.msg === 'api_id not found') {
          ElMessageBox.alert(
            '接口不存在，请先创建对应的接口。',
            '用例创建失败',
            { confirmButtonText: '知道了', type: 'error' }
          ).catch(() => {})
        } else {
          ElMessageBox.alert(
            `创建失败：${firstError?.msg || '未知错误'}`,
            '用例创建失败',
            { confirmButtonText: '知道了', type: 'error' }
          ).catch(() => {})
        }
      }
    },
    async createFlow() {
      try {
        const payload = JSON.parse(this.flowText)
        await createFlow(payload)
        ElMessage.success('流程创建成功')
      } catch (e) {
        const errMsg = e.response?.data?.error || e.message
        if (errMsg.includes('项目') && (errMsg.includes('不存在') || errMsg.includes('禁用'))) {
          ElMessage.error(errMsg + '，请先到项目管理中创建或启用该项目')
        } else {
          ElMessage.error('流程创建失败：' + errMsg)
        }
      }
    },
    async copySample() {
      if (!this.sampleText) return
      await navigator.clipboard.writeText(this.sampleText)
      ElMessage.success('已复制')
    }
  }
}
</script>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 18px;
  align-items: start;
}

.left {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.right {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.actions {
  display: flex;
  gap: 10px;
}

.mini {
  margin-bottom: 0;
}

.nl-tabs {
  margin-bottom: 12px;
}

:deep(.mini .panel-body) {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

:deep(.mini .el-textarea) {
  flex: 1;
}

:deep(.mini .el-textarea__inner) {
  min-height: 160px;
}

.error-block {
  margin-bottom: 8px;
  color: var(--accent);
}

.help-pre {
  max-height: 420px;
  overflow: auto;
  background: var(--panel-2);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px;
}

@media (max-width: 1024px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>