<template>
  <aside class="sidebar">
    <div class="brand">
      <div class="logo">TP</div>
      <div>
        <div class="name">测试平台</div>
        <div class="text-muted">Vue3 + Element Plus</div>
      </div>
    </div>

    <el-menu :default-active="active" class="menu" router>
      <el-menu-item index="/">概览</el-menu-item>
      <el-menu-item index="/interfaces" v-if="can('interface:read')">接口管理</el-menu-item>
      <el-menu-item index="/testcases" v-if="can('testcase:read')">用例管理</el-menu-item>
      <el-menu-item index="/flows" v-if="can('flow:read')">流程管理</el-menu-item>
      <el-menu-item index="/functions" v-if="can('function:read')">函数管理</el-menu-item>
      <el-menu-item index="/param-templates" v-if="can('param:read')">参数模板</el-menu-item>
      <el-menu-item index="/results" v-if="can('run:read')">运行结果</el-menu-item>
      <el-menu-item index="/suite" v-if="can('run:execute')">套件运行</el-menu-item>
      <el-menu-item index="/users" v-if="can('superadmin')">用户管理</el-menu-item>
      <el-menu-item index="/nl" v-if="canAny(['interface:write','testcase:write'])">自然语言录入</el-menu-item>
    </el-menu>

    <div class="controls">
      <div class="control-row">
        <span class="text-muted">Base URL</span>
        <el-input v-model="baseUrlLocal" size="small" @change="saveBase" />
      </div>
      <div class="control-row">
        <span class="text-muted">暗色模式</span>
        <el-switch v-model="dark" @change="toggleDark" />
      </div>
      <el-button type="danger" plain size="small" @click="doLogout">退出登录</el-button>
    </div>
  </aside>
</template>

<script>
import { mapState } from 'vuex'
import { logout } from '../api'
import { hasPerm, hasAnyPerm } from '../utils/perm'

export default {
  name: 'Sidebar',
  computed: {
    ...mapState(['baseUrl', 'darkMode', 'user']),
    active() {
      return this.$route.path
    },
    dark: {
      get() { return this.darkMode },
      set(val) { this.$store.commit('setDarkMode', val) }
    }
  },
  data() {
    return { baseUrlLocal: this.baseUrl }
  },
  methods: {
    can(p) {
      return hasPerm(this.user?.permissions, p)
    },
    canAny(list) {
      return hasAnyPerm(this.user?.permissions, list)
    },
    saveBase() {
      this.$store.commit('setBaseUrl', this.baseUrlLocal || '')
    },
    toggleDark(val) {
      this.$store.commit('setDarkMode', val)
    },
    async doLogout() {
      try { await logout() } catch (e) { /* ignore */ }
      this.$store.commit('logout')
      this.$router.push('/login')
    }
  }
}
</script>

<style scoped>
.sidebar {
  width: 240px;
  padding: 18px 14px 16px;
  background: var(--panel);
  border-right: 1px solid var(--border);
  min-height: 100vh;
}

.brand {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.logo {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--brand), var(--brand-2));
  display: grid;
  place-items: center;
  color: #fff;
  font-weight: 700;
}

.name {
  font-weight: 600;
}

.menu {
  background: transparent;
  border: none;
}

.controls {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.control-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* Dark mode contrast for sidebar navigation */
:global(.dark) .sidebar {
  background: #1c2333;
  border-right-color: #2b3650;
}

:global(.sidebar .el-menu-item) {
  border-radius: 10px;
  margin: 2px 0;
}

:global(.dark) .sidebar .el-menu-item {
  color: #e2e8f0;
}

:global(.dark) .sidebar .el-menu-item .el-menu-item__title,
:global(.dark) .sidebar .el-menu-item * {
  color: #e2e8f0;
}

:global(.dark) .sidebar .el-menu-item:hover {
  background: rgba(90, 162, 255, 0.12);
  color: #e6f0ff;
}

:global(.dark) .sidebar .el-menu-item.is-active {
  background: rgba(90, 162, 255, 0.2);
  color: #ffffff;
}
</style>
