<template>
  <div class="page">
    <div class="panel">
      <div class="panel-header">用户管理</div>
      <div class="panel-body">
        <div class="toolbar">
          <el-button type="primary" @click="fetchList">刷新</el-button>
          <el-button v-if="isAdmin" @click="openCreate">创建账号</el-button>
          <span v-else class="text-muted">仅管理员可创建/编辑/删除账号与授权</span>
        </div>

        <el-table :data="list" style="width: 100%" v-loading="loading">
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column prop="username" label="账号" />
          <el-table-column prop="is_active" label="启用" width="90" />
          <el-table-column prop="permissions" label="权限" />
          <el-table-column label="操作" width="220">
            <template #default="scope">
              <el-button size="small" @click="openEdit(scope.row)" v-if="isAdmin">授权/编辑</el-button>
              <el-button size="small" type="danger" @click="remove(scope.row)" v-if="isAdmin">删除</el-button>
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
import { listUsers, createUser, updateUser, deleteUser } from '../api'
import JsonEditorDialog from '../components/JsonEditorDialog.vue'

export default {
  name: 'Users',
  components: { JsonEditorDialog },
  computed: {
    isAdmin() {
      const perms = this.$store.state.user?.permissions || []
      return perms.includes('superadmin')
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
      helpContent: `// 用户 JSON 示例（创建）
{
  "username": "user1",
  "password": "Passw0rd!",
  "is_active": true,
  "permissions": [
    "interface:read",
    "testcase:read",
    "flow:read",
    "function:read",
    "run:read"
  ]
}

// 用户 JSON 示例（修改）
{
  "password": "NewPassw0rd!",
  "is_active": true,
  "permissions": [
    "superadmin"
  ]
}

// 说明
// permissions 支持：
// interface:read / interface:write
// testcase:read / testcase:write
// flow:read / flow:write / flow:execute
// function:read / function:execute
// run:read / run:execute
// param:read / param:write
// superadmin（拥有所有权限）
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
        const res = await listUsers()
        this.list = res.data
      } finally {
        this.loading = false
      }
    },
    openCreate() {
      this.editingId = null
      this.dialogTitle = '创建账号'
      this.dialogText = JSON.stringify({
        username: 'u1',
        password: 'p1',
        is_active: true,
        permissions: ['interface:read']
      }, null, 2)
      this.dialogVisible = true
    },
    openEdit(row) {
      this.editingId = row.id
      this.dialogTitle = `编辑账号 #${row.id}`
      this.dialogText = JSON.stringify({
        password: '',
        is_active: row.is_active,
        permissions: row.permissions
      }, null, 2)
      this.dialogVisible = true
    },
    async save(text) {
      let payload
      try { payload = JSON.parse(text) } catch (e) { return this.$message.error('JSON 格式错误') }
      if (this.editingId) {
        await updateUser(this.editingId, payload)
      } else {
        await createUser(payload)
      }
      this.dialogVisible = false
      this.fetchList()
    },
    async remove(row) {
      await deleteUser(row.id)
      this.fetchList()
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
