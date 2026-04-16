<template>
    <div class="page">
      <div class="panel">
        <div class="panel-header">项目管理</div>
        <div class="panel-body">
          <div class="toolbar">
            <el-button type="primary" @click="fetchList">刷新</el-button>
            <el-button v-if="canWrite" @click="openCreate">新建项目</el-button>
          </div>
  
          <el-table :data="list" v-loading="loading">
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column prop="name" label="项目" />
            <el-table-column prop="description" label="描述" />
            <el-table-column label="状态" width="100">
              <template #default="scope">
                <el-switch
                  v-model="scope.row.enabled"
                  :disabled="!canWrite"
                  @change="toggleEnabled(scope.row)"
                />
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" />
            <el-table-column label="操作" width="180" v-if="canWrite">
              <template #default="scope">
                <el-button size="small" @click="openEdit(scope.row)">编辑</el-button>
                <el-button size="small" type="danger" @click="remove(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
  
      <el-dialog v-model="dialogVisible" :title="dialogTitle" width="30%">
        <el-form :model="form" label-width="80px">
          <el-form-item label="项目" required>
            <el-input v-model="form.name" />
          </el-form-item>
          <el-form-item label="描述">
            <el-input v-model="form.description" type="textarea" />
          </el-form-item>
          <el-form-item label="启用">
            <el-switch v-model="form.enabled" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="save">确定</el-button>
        </template>
      </el-dialog>
    </div>
  </template>
  
  <script>
  import { listProjects, createProject, updateProject, deleteProject } from '../api'
  import { mapState } from 'vuex'
  import { hasPerm } from '../utils/perm'
  
  export default {
    name: 'Projects',
    computed: {
      ...mapState(['user']),
      canWrite() {
        return hasPerm(this.user?.permissions, 'project:write')
      }
    },
    data() {
      return {
        list: [],
        loading: false,
        dialogVisible: false,
        dialogTitle: '',
        form: { name: '', description: '', enabled: true },
        editingId: null
      }
    },
    mounted() {
      this.fetchList()
    },
    methods: {
      async fetchList() {
        this.loading = true
        try {
          const res = await listProjects()
          this.list = res.data
        } finally {
          this.loading = false
        }
      },
      openCreate() {
        this.editingId = null
        this.dialogTitle = '新建项目'
        this.form = { name: '', description: '', enabled: true }
        this.dialogVisible = true
      },
      openEdit(row) {
        this.editingId = row.id
        this.dialogTitle = '编辑项目'
        this.form = { name: row.name, description: row.description, enabled: row.enabled }
        this.dialogVisible = true
      },
      async save() {
        if (!this.form.name) {
          this.$message.error('项目不能为空')
          return
        }
        try {
          if (this.editingId) {
            await updateProject(this.editingId, this.form)
            this.$message.success('更新成功')
          } else {
            await createProject(this.form)
            this.$message.success('创建成功')
          }
          this.dialogVisible = false
          this.fetchList()
        } catch (err) {
          this.$message.error(err.response?.data?.error || '操作失败')
        }
      },
      async toggleEnabled(row) {
        try {
          await updateProject(row.id, { enabled: row.enabled })
          this.$message.success(`已${row.enabled ? '启用' : '禁用'}`)
        } catch (err) {
          row.enabled = !row.enabled
          this.$message.error(err.response?.data?.error || '切换状态失败')
        }
      },
      async remove(row) {
        try {
          await this.$confirm(`确定删除项目“${row.name}”吗？`, '提示', { type: 'warning' })
          await deleteProject(row.id)
          this.$message.success('删除成功')
          this.fetchList()
        } catch (err) {
          if (err !== 'cancel') {
            this.$message.error(err.response?.data?.error || '删除失败')
          }
        }
      }
    }
  }
  </script>