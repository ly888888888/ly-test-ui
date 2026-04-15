<template>
  <div class="page">
    <div class="panel">
      <div class="panel-header">函数管理</div>
      <div class="panel-body">
        <div class="toolbar">
          <el-button type="primary" @click="fetchList">刷新</el-button>
        </div>

        <el-table :data="list" style="width: 100%" v-loading="loading">
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="description" label="描述" />
          <el-table-column label="操作" width="140">
            <template #default="scope">
              <el-button size="small" @click="viewDetail(scope.row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <JsonEditorDialog
      v-model="dialogVisible"
      title="函数详情"
      :json-text="dialogText"
      :show-template-insert="false"
      :show-help="false"
      @confirm="dialogVisible = false"
    />
  </div>
</template>

<script>
import { listFunctions, getFunctionDetail } from '../api'
import JsonEditorDialog from '../components/JsonEditorDialog.vue'

export default {
  name: 'Functions',
  components: { JsonEditorDialog },
  data() {
    return {
      list: [],
      loading: false,
      dialogVisible: false,
      dialogText: ''
    }
  },
  mounted() {
    this.fetchList()
  },
  methods: {
    async fetchList() {
      this.loading = true
      try {
        const res = await listFunctions()
        this.list = res.data
      } finally {
        this.loading = false
      }
    },
    async viewDetail(row) {
      const res = await getFunctionDetail(row.name)
      this.dialogText = JSON.stringify(res.data, null, 2)
      this.dialogVisible = true
    }
  }
}
</script>

<style scoped>
.toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
}
</style>
