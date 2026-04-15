<template>
  <div class="page">
    <div class="panel">
      <div class="panel-header">流程管理</div>
      <div class="panel-body">
        <div class="toolbar">
          <el-button type="primary" @click="fetchList">刷新</el-button>
          <el-button v-if="canWrite" @click="openCreate">新建</el-button>
          <el-button @click="exportData">导出</el-button>
        </div>

        <el-table :data="list" style="width: 100%" v-loading="loading">
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="description" label="描述" />
          <el-table-column prop="enabled" label="启用" width="90" />
          <el-table-column label="操作" width="320">
            <template #default="scope">
              <el-button size="small" v-if="canWrite" @click="openEdit(scope.row)">编辑</el-button>
              <el-button size="small" type="danger" v-if="canWrite" @click="remove(scope.row)">删除</el-button>
              <el-button size="small" type="primary" v-if="canRun" @click="openRun(scope.row)">运行</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <JsonEditorDialog
      v-model="dialogVisible"
      :title="dialogTitle"
      :json-text="dialogText"
      :help-content="helpContent"
      :show-step-select="true"
      @confirm="save"
    />

    <el-dialog v-model="runVisible" title="运行流程" width="40%">
      <el-form>
        <el-form-item label="Host">
          <el-input v-model="runPayload.host" placeholder="172.17.12.101:9500" />
        </el-form-item>
        <el-form-item label="对比Host">
          <el-input v-model="runPayload.host_compare" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="runVisible = false">取消</el-button>
        <el-button type="primary" @click="runNow">运行</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { listFlows, createFlow, updateFlow, deleteFlow, runFlow } from '../api'
import JsonEditorDialog from '../components/JsonEditorDialog.vue'
import { exportToExcel, saveRecentRun } from '../utils/export'
import { mapState } from 'vuex'
import { hasPerm } from '../utils/perm'

export default {
  name: 'Flows',
  components: { JsonEditorDialog },
  computed: {
    ...mapState(['user']),
    canWrite() {
      return hasPerm(this.user?.permissions, 'flow:write')
    },
    canRun() {
      return hasPerm(this.user?.permissions, 'flow:execute')
    }
  },
  data() {
    return {
      list: [],
      loading: false,
      dialogVisible: false,
      dialogTitle: '',
      dialogText: '',
      editingId: null,
      runVisible: false,
      runPayload: { host: '', host_compare: '' },
      runId: null,
      helpContent: `// 流程 JSON 示例
{
  "name": "demo_flow",
  "description": "示例流程",
  "steps": [
    {
      "name": "step1",
      "api_id": 1,
      "params": {
        "uid": {"type":"template","name":"tpl_uid"},
        "token": {"type":"fixed","value":"abc"}
      },
      "assertions": [
        {"type":"path","path":"data.code","operator":"eq","value":0}
      ],
      "extract": {"token":"data.token"}
    }
  ],
  "enabled": true
}

// steps 中可用 params/assertions/extract
`
    }
  },
  mounted() {
    this.fetchList()
  },
  methods: {
    async fetchList() {
      this.loading = true
      try {
        const res = await listFlows()
        this.list = res.data
      } finally {
        this.loading = false
      }
    },
    openCreate() {
      this.editingId = null
      this.dialogTitle = '新建流程'
      this.dialogText = JSON.stringify({
        name: 'demo_flow',
        description: '',
        steps: [{ name: 'step1', api_id: 1 }],
        enabled: true
      }, null, 2)
      this.dialogVisible = true
    },
    openEdit(row) {
      this.editingId = row.id
      this.dialogTitle = `编辑流程 #${row.id}`
      this.dialogText = JSON.stringify(row, null, 2)
      this.dialogVisible = true
    },
    async save(text) {
      let payload
      try { payload = JSON.parse(text) } catch (e) { return this.$message.error('JSON 格式错误') }
      if (this.editingId) {
        await updateFlow(this.editingId, payload)
      } else {
        await createFlow(payload)
      }
      this.dialogVisible = false
      this.fetchList()
    },
    async remove(row) {
      await deleteFlow(row.id)
      this.fetchList()
    },
    openRun(row) {
      this.runId = row.id
      this.runPayload = { host: '', host_compare: '' }
      this.runVisible = true
    },
    async runNow() {
      const res = await runFlow(this.runId, this.runPayload)
      this.runVisible = false
      saveRecentRun(res.data.run_id || res.data.runId, 'flow')
      this.$router.push({ path: '/results', query: { run_id: res.data.run_id || res.data.runId, type: 'flow' } })
    },
    exportData() {
      exportToExcel(this.list, 'flows.xlsx')
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
</style>
