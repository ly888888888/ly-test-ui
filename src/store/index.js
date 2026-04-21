import { createStore } from 'vuex'

const token = localStorage.getItem('token') || ''
const storedUser = localStorage.getItem('user')
const user = storedUser ? JSON.parse(storedUser) : null
const darkMode = localStorage.getItem('darkMode') === '1'

export default createStore({
  state: {
    token,
    user,
    baseUrl: localStorage.getItem('baseUrl') || '',
    tabs: [],
    darkMode
  },
  mutations: {
    setToken(state, tokenValue) {
      state.token = tokenValue
      localStorage.setItem('token', tokenValue)
    },
    setUser(state, user) {
      state.user = user
      localStorage.setItem('user', JSON.stringify(user || null))
    },
    logout(state) {
      state.token = ''
      state.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
    addTab(state, tab) {
      if (!tab || !tab.path || tab.path === '/login') return
      if (!state.tabs.find(t => t.path === tab.path)) {
        state.tabs.push(tab)
      }
    },
    removeTab(state, path) {
      state.tabs = state.tabs.filter(t => t.path !== path)
    },
    setBaseUrl(state, url) {
      const cleanUrl = url || ''
      state.baseUrl = cleanUrl
      if (cleanUrl) {
        localStorage.setItem('baseUrl', cleanUrl)
      } else {
        localStorage.removeItem('baseUrl')
      }
    },
    setDarkMode(state, val) {
      state.darkMode = val
      localStorage.setItem('darkMode', val ? '1' : '0')
    }
  }
})