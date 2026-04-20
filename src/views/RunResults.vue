<template>
  <div class="page">
    <!-- 列表视图（无 run_id 参数） -->
    <div v-if="!runId" class="panel">
      <div class="panel-header">运行记录</div>
      <div class="panel-body">
        <div class="toolbar">
          <el-select
            v-model="filters.type"
            placeholder="类型"
            style="width: 100px"
            clearable
            @change="handleSearch"
          >
            <el-option label="用例" value="testcase" />
            <el-option label="流程" value="flow" />
          </el-select>
          <el-input
            v-model="filters.run_id"
            placeholder="运行ID"
            style="width: 200px"
            clearable
            @keyup.enter="handleSearch"
          />
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </div>

        <el-table :data="list" v-loading="loading" style="width: 100%">
          <!-- 序号列：基于分页累加 -->
          <el-table-column label="序号" width="60" align="center">
            <template #default="scope">
              {{ (pagination.page - 1) * pagination.pageSize + scope.$index + 1 }}
            </template>
          </el-table-column>
          <el-table-column prop="run_id" label="运行ID" min-width="200" show-overflow-tooltip />
          <el-table-column prop="type" label="类型" width="80">
            <template #default="scope">
              <el-tag :type="scope.row.type === 'testcase' ? 'primary' : 'success'" size="small">
                {{ scope.row.type === 'testcase' ? '用例' : '流程' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="用例/流程ID" width="100">
            <template #default="scope">
              {{ scope.row.type === 'testcase' ? scope.row.case_id : scope.row.flow_id }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-tag :type="statusTagType(scope.row.status)" size="small">
                {{ scope.row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="http_status" label="HTTP状态" width="100" />
          <el-table-column prop="error_info" label="错误信息" min-width="200" show-overflow-tooltip />
          <el-table-column prop="start_time" label="开始时间" width="160">
            <template #default="scope">
              {{ formatDateTime(scope.row.start_time) }}
            </template>
          </el-table-column>
          <el-table-column prop="duration_ms" label="耗时(ms)" width="100" />
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="scope">
              <el-button size="small" type="primary" @click="viewDetail(scope.row)">
                详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="fetchList"
            @current-change="fetchList"
          />
        </div>
      </div>
    </div>

    <!-- 详情视图（有 run_id 参数） -->
    <div v-else class="panel">
      <div class="panel-header">
        运行详情
        <el-button size="small" style="margin-left: 16px" @click="goBack">返回列表</el-button>
      </div>
      <div class="panel-body">
        <div class="toolbar">
          <el-input v-model="runId" disabled style="width: 300px" />
          <el-select v-model="type" placeholder="类型" style="width: 120px" disabled>
            <el-option label="用例" value="testcase" />
            <el-option label="流程" value="flow" />
          </el-select>
          <el-button type="primary" @click="fetchResult" :loading="detailLoading">查询</el-button>
          <el-button @click="toggleAuto">{{ auto ? '停止自动' : '自动刷新' }}</el-button>
        </div>

        <el-alert v-if="error" type="error" :title="error" show-icon />

        <div v-if="result" class="result">
          <pre class="mono">{{ result }}</pre>
        </div>

        <LogPanel :logs="logs" />
      </div>
    </div>
  </div>
</template>

<script>
import { getRunResults, getFlowResults, listRunRecords } from '../api'
import LogPanel from '../components/LogPanel.vue'
import { mapState } from 'vuex'
import { hasPerm } from '../utils/perm'
import dayjs from 'dayjs'

export default {
  name: 'RunResults',
  components: { LogPanel },
  computed: {
    ...mapState(['user']),
    canRead() {
      return hasPerm(this.user?.permissions, 'run:read')
    },
    runId() {
      return this.$route.query.run_id || ''
    },
    type() {
      return this.$route.query.type || 'testcase'
    }
  },
  data() {
    return {
      list: [],
      loading: false,
      filters: { run_id: '', type: '' },
      pagination: {
        page: 1,
        pageSize: 20,
        total: 0
      },
      result: '',
      error: '',
      logs: [],
      auto: false,
      detailLoading: false,
      timer: null
    }
  },
  watch: {
    runId: {
      handler(val) {
        if (val) {
          this.fetchResult()
        } else {
          this.result = ''
          this.error = ''
          this.logs = []
          this.fetchList()
        }
      },
      immediate: true
    }
  },
  beforeUnmount() {
    clearInterval(this.timer)
  },
  methods: {
    async fetchList() {
      if (!this.canRead) return
      this.loading = true
      try {
        const params = {
          page: this.pagination.page,
          page_size: this.pagination.pageSize,
          run_id: this.filters.run_id || undefined,
          type: this.filters.type || undefined
        }
        const res = await listRunRecords(params)
        this.list = res.data.items || []
        this.pagination.total = res.data.total || 0
      } catch (err) {
        this.$message.error('获取运行记录失败')
      } finally {
        this.loading = false
      }
    },
    handleSearch() {
      this.pagination.page = 1
      this.fetchList()
    },
    resetSearch() {
      this.filters = { run_id: '', type: '' }
      this.pagination.page = 1
      this.fetchList()
    },
    viewDetail(row) {
      this.$router.push({ path: '/results', query: { run_id: row.run_id, type: row.type } })
    },
    async fetchResult() {
      if (!this.runId) return
      this.error = ''
      this.detailLoading = true
      try {
        const res = this.type === 'flow'
          ? await getFlowResults(this.runId)
          : await getRunResults(this.runId)
        this.result = JSON.stringify(res.data, null, 2)
        this.logs.push(`[${new Date().toLocaleTimeString()}] 拉取 ${this.runId}`)
      } catch (e) {
        this.error = e.response?.data?.error || e.message
      } finally {
        this.detailLoading = false
      }
    },
    toggleAuto() {
      this.auto = !this.auto
      if (this.auto) {
        this.fetchResult()
        this.timer = setInterval(this.fetchResult, 5000)
      } else {
        clearInterval(this.timer)
      }
    },
    goBack() {
      this.$router.push('/results')
    },
    statusTagType(status) {
      const map = {
        success: 'success',
        fail: 'danger',
        error: 'warning',
        running: 'info'
      }
      return map[status] || 'info'
    },
    formatDateTime(dateStr) {
      if (!dateStr) return '-'
      return dayjs(dateStr).format('YYYY-MM-DD HH:mm:ss')
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
.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
.result {
  background: var(--panel-2);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px;
  max-height: 420px;
  overflow: auto;
}
</style>