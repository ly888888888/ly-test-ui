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
          <el-table-column prop="project" label="项目" />
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="description" label="描述" />
          <el-table-column label="启用" width="90">
            <template #default="scope">
              <el-switch
                v-model="scope.row.enabled"
                :disabled="!canWrite"
                @change="toggleEnabled(scope.row)"
              />
            </template>
          </el-table-column>
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
        <el-form-item label="Host" required>
          <el-input v-model="runPayload.host" placeholder="172.17.12.101:9500" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="runVisible = false">取消</el-button>
        <el-button type="primary" @click="runNow" :loading="runLoading">运行</el-button>
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
import { ElMessage, ElMessageBox } from 'element-plus'

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
      runPayload: { host: '' },
      runId: null,
      runLoading: false,
      helpContent: `// 流程 JSON 示例
{
  "name": "demo_flow",
  "description": "示例流程",
  "project": "demo",
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
      } catch (error) {
        ElMessage.error('获取流程列表失败')
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
        project: 'demo',
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
      try {
        payload = JSON.parse(text)
      } catch (e) {
        ElMessage.error('JSON 格式错误')
        return
      }
      // 确保 payload 中包含 project 字段
      if (!payload.project) {
        ElMessage.error('流程 JSON 中必须包含 project 字段（项目名称）')
        return
      }
      try {
        if (this.editingId) {
          await updateFlow(this.editingId, payload)
          ElMessage.success('更新成功')
        } else {
          await createFlow(payload)
          ElMessage.success('创建成功')
        }
        this.dialogVisible = false
        this.fetchList()
      } catch (error) {
        const errMsg = error.response?.data?.error || error.message
        if (errMsg.includes('项目') && (errMsg.includes('不存在') || errMsg.includes('禁用'))) {
          ElMessage.error(errMsg + '，请先到项目管理中创建或启用该项目')
        } else {
          ElMessage.error(`保存失败：${errMsg}`)
        }
      }
    },
    async toggleEnabled(row) {
      try {
        await updateFlow(row.id, { enabled: row.enabled })
        ElMessage.success(`已${row.enabled ? '启用' : '禁用'}`)
      } catch (error) {
        row.enabled = !row.enabled
        const errMsg = error.response?.data?.error || error.message
        ElMessage.error(`切换状态失败：${errMsg}`)
      }
    },
    async remove(row) {
      try {
        await ElMessageBox.confirm(
          `确定要删除流程 “${row.name}” 吗？`,
          '删除确认',
          { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
        )
      } catch {
        return
      }
      try {
        await deleteFlow(row.id)
        ElMessage.success('删除成功')
        this.fetchList()
      } catch (error) {
        if (error.response?.status === 400) {
          const errMsg = error.response.data?.error
          if (errMsg && errMsg.includes('referenced')) {
            ElMessageBox.alert(
              '该流程可能被其他资源引用，请先解除引用后再删除。',
              '无法删除',
              { confirmButtonText: '知道了', type: 'error' }
            ).catch(() => {})
          } else {
            ElMessage.error(errMsg || '删除失败')
          }
        } else {
          ElMessage.error('删除失败，请稍后重试')
        }
      }
    },
    openRun(row) {
      this.runId = row.id
      this.runPayload = { host: '' }
      this.runVisible = true
    },
    async runNow() {
      if (!this.runPayload.host || this.runPayload.host.trim() === '') {
        ElMessage.warning('请输入 Host 地址')
        return
      }
      this.runLoading = true
      try {
        const res = await runFlow(this.runId, this.runPayload)
        this.runVisible = false
        saveRecentRun(res.data.run_id || res.data.runId, 'flow')
        this.$router.push({ path: '/results', query: { run_id: res.data.run_id || res.data.runId, type: 'flow' } })
      } catch (error) {
        const errMsg = error.response?.data?.error || error.message
        ElMessage.error(`运行失败：${errMsg}`)
      } finally {
        this.runLoading = false
      }
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