<template>
  <div class="tabs">
    <div class="left">
      <span class="title">工作区</span>
      <div class="tab" v-for="tab in tabs" :key="tab.path" :class="{ active: tab.path === $route.path }">
        <router-link :to="tab.path">{{ tab.title }}</router-link>
        <button class="close" @click="close(tab.path)">x</button>
      </div>
    </div>
    <div class="right">
      <span class="user">当前用户：{{ username || '未知' }}</span>
      <span class="text-muted mono">{{ now }}</span>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import dayjs from 'dayjs'

export default {
  name: 'TopTabs',
  data() {
    return { now: dayjs().format('YYYY-MM-DD HH:mm:ss') }
  },
  computed: {
    ...mapState(['tabs', 'user']),
    username() {
      return this.user?.username
    }
  },
  mounted() {
    this.timer = setInterval(() => {
      this.now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    }, 1000)
  },
  beforeUnmount() {
    clearInterval(this.timer)
  },
  methods: {
    close(path) {
      this.$store.commit('removeTab', path)
      if (this.$route.path === path) {
        this.$router.push('/')
      }
    }
  }
}
</script>

<style scoped>
.tabs {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border);
  background: rgba(255,255,255,0.4);
  backdrop-filter: blur(8px);
}

.left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.title {
  font-weight: 600;
}

.tab {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 13px;
}

.tab.active {
  border-color: var(--brand);
  box-shadow: var(--shadow);
}

.close {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  color: var(--muted);
}

.right {
  display: flex;
  align-items: center;
  gap: 14px;
}

.user {
  font-weight: 600;
  color: var(--text);
}
</style>
