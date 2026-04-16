<template>
  <div class="page">
    <div class="panel">
      <div class="panel-header">接口管理</div>
      <div class="panel-body">
        <div class="toolbar">
          <el-input v-model="filters.project" placeholder="项目" />
          <el-input v-model="filters.path" placeholder="路径" />
          <el-input v-model="filters.method" placeholder="方法" />
          <el-button type="primary" @click="fetchList">查询</el-button>
          <el-button v-if="canWrite" @click="openCreate">新建</el-button>
          <el-button @click="exportData">导出</el-button>
        </div>

        <el-table :data="list" style="width: 100%" v-loading="loading">
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column prop="project" label="项目" />
          <el-table-column prop="path" label="路径" />
          <el-table-column prop="method" label="方法" width="90" />
          <el-table-column prop="description" label="描述" />
          <el-table-column label="操作" width="220">
            <template #default="scope">
              <el-button size="small" v-if="canWrite" @click="openEdit(scope.row)">编辑</el-button>
              <el-button size="small" type="danger" v-if="canWrite" @click="remove(scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <JsonEditorDialog
      v-model="dialogVisible"
      :title="dialogTitle"
      :json-text="dialogText"
      :show-template-insert="false"
      :help-content="helpContent"
      @confirm="save"
    />
  </div>
</template>

<script>
import { listInterfaces, createInterface, updateInterface, deleteInterface } from '../api'
import JsonEditorDialog from '../components/JsonEditorDialog.vue'
import { exportToExcel } from '../utils/export'
import { mapState } from 'vuex'
import { hasPerm } from '../utils/perm'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'Interfaces',
  components: { JsonEditorDialog },
  computed: {
    ...mapState(['user']),
    canWrite() {
      return hasPerm(this.user?.permissions, 'interface:write')
    }
  },
  data() {
    return {
      filters: { project: '', path: '', method: '' },
      list: [],
      loading: false,
      dialogVisible: false,
      dialogTitle: '',
      dialogText: '',
      editingId: null,
      helpContent: `// 接口 JSON 示例
{
  "project": "jupiter",
  "path": "/api/demo",
  "method": "GET",
  "schema": {"type":"object"},
  "description": "示例接口"
}

// 说明
// method 可为 GET/POST/PUT/DELETE
// schema 为返回体的 JSON Schema
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
        const res = await listInterfaces(this.filters)
        this.list = res.data
      } finally {
        this.loading = false
      }
    },
    openCreate() {
      this.editingId = null
      this.dialogTitle = '新建接口'
      this.dialogText = JSON.stringify({
        project: 'jupiter',
        path: '/api/demo',
        method: 'GET',
        schema: { type: 'object' },
        description: ''
      }, null, 2)
      this.dialogVisible = true
    },
    openEdit(row) {
      this.editingId = row.id
      this.dialogTitle = `编辑接口 #${row.id}`
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
      try {
        if (this.editingId) {
          await updateInterface(this.editingId, payload)
        } else {
          await createInterface(payload)
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
    async remove(row) {
      try {
        await ElMessageBox.confirm(
          `确定要删除接口 “${row.method} ${row.path}” 吗？`,
          '删除确认',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
          }
        )
      } catch {
        return
      }

      try {
        await deleteInterface(row.id)
        ElMessage.success('删除成功')
        this.fetchList()
      } catch (error) {
        if (error.response && error.response.status === 400) {
          const errMsg = error.response.data?.error
          if (errMsg === 'Interface has test cases, cannot delete') {
            ElMessageBox.alert(
              '该接口已被测试用例引用，请先删除或转移相关测试用例后再删除接口。',
              '无法删除',
              {
                confirmButtonText: '知道了',
                type: 'error',
              }
            )
          } else {
            ElMessage.error(errMsg || '删除失败')
          }
        } else {
          ElMessage.error('删除失败，请稍后重试')
        }
      }
    },
    exportData() {
      exportToExcel(this.list, 'interfaces.xlsx')
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