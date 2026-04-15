<template>
  <div :class="['app-shell', { dark: darkMode }]">
    <Sidebar v-if="isAuthed" />
    <div class="main">
      <TopTabs v-if="isAuthed" />
      <router-view />
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import Sidebar from './components/Sidebar.vue'
import TopTabs from './components/TopTabs.vue'

export default {
  name: 'App',
  components: { Sidebar, TopTabs },
  computed: {
    ...mapState(['token', 'darkMode']),
    isAuthed() {
      return !!this.token
    }
  },
  watch: {
    darkMode: {
      immediate: true,
      handler(val) {
        document.body.classList.toggle('dark', !!val)
      }
    }
  }
}
</script>

<style scoped>
.app-shell {
  display: flex;
  min-height: 100vh;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>