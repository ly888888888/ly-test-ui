<template>
  <div class="page">
    <div class="panel">
      <div class="panel-header">参数模板</div>
      <div class="panel-body">
        <div class="toolbar">
          <el-button type="primary" @click="fetchList">刷新</el-button>
          <el-button v-if="canWrite" @click="openCreate">新建</el-button>
        </div>

        <el-table :data="list" style="width: 100%" v-loading="loading">
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="type" label="类型" width="120" />
          <el-table-column prop="value" label="值" />
          <el-table-column prop="description" label="描述" />
          <el-table-column label="操作" width="260">
            <template #default="scope">
              <el-button size="small" @click="preview(scope.row)">预览</el-button>
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
      :templates="list"
      :show-template-insert="false"
      :help-content="helpContent"
      @confirm="save"
    />

    <el-dialog v-model="previewVisible" title="模板预览/校验" width="50%">
      <div v-if="previewError" class="error">{{ previewError }}</div>
      <pre v-else class="mono">{{ previewText }}</pre>
      <template #footer>
        <el-button @click="previewVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { listParamTemplates, createParamTemplate, updateParamTemplate, deleteParamTemplate, previewParamTemplate } from '../api'
import JsonEditorDialog from '../components/JsonEditorDialog.vue'
import { mapState } from 'vuex'
import { hasPerm } from '../utils/perm'

export default {
  name: 'ParamTemplates',
  components: { JsonEditorDialog },
  computed: {
    ...mapState(['user']),
    canWrite() {
      return hasPerm(this.user?.permissions, 'param:write')
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
      previewVisible: false,
      previewText: '',
      previewError: '',
      helpContent: `// 参数模板 JSON 示例
{
  "name": "tpl_user_id",
  "type": "fixed",
  "value": "12345",
  "description": "固定用户ID"
}

// type = db_query
{
  "name": "tpl_media_id",
  "type": "db_query",
  "value": "SELECT media_id FROM db_jupiter_media.fm_media WHERE disable=0 LIMIT 1",
  "description": "随机取一条 media_id"
}

// type = function（无参）
{
  "name": "tpl_version",
  "type": "function",
  "value": "randomVer",
  "description": "随机版本号"
}

// type = function（带参）
{
  "name": "tpl_uid",
  "type": "function",
  "value": {"function":"getUid","args":{"min":1000,"max":9999}},
  "description": "随机用户ID"
}

// type = random
{
  "name": "tpl_rand",
  "type": "random",
  "value": "any",
  "description": "随机值（占位）"
}
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
        const res = await listParamTemplates()
        this.list = res.data
      } finally {
        this.loading = false
      }
    },
    openCreate() {
      this.editingId = null
      this.dialogTitle = '新建参数模板'
      this.dialogText = JSON.stringify({
        name: 'tpl1',
        type: 'fixed',
        value: '',
        description: ''
      }, null, 2)
      this.dialogVisible = true
    },
    openEdit(row) {
      this.editingId = row.id
      this.dialogTitle = `编辑参数模板 #${row.id}`
      this.dialogText = JSON.stringify({
        name: row.name,
        type: row.type,
        value: row.value,
        description: row.description
      }, null, 2)
      this.dialogVisible = true
    },
    async save(text) {
      let payload
      try { payload = JSON.parse(text) } catch (e) { return this.$message.error('JSON 格式错误') }
      if (this.editingId) {
        await updateParamTemplate(this.editingId, payload)
      } else {
        await createParamTemplate(payload)
      }
      this.dialogVisible = false
      this.fetchList()
    },
    async remove(row) {
      await deleteParamTemplate(row.id)
      this.fetchList()
    },
    async preview(row) {
      this.previewVisible = true
      this.previewText = ''
      this.previewError = ''
      try {
        const res = await previewParamTemplate({ id: row.id })
        this.previewText = JSON.stringify(res.data, null, 2)
      } catch (e) {
        this.previewError = e.response?.data?.error || e.message
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

.error {
  color: var(--accent);
  margin-bottom: 8px;
}
</style>
