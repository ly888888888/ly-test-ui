import axios from 'axios'
import store from '../store'

const http = axios.create({
  timeout: 20000
})

http.interceptors.request.use(config => {
  let baseUrl = store.state.baseUrl
  // 调试输出，可在控制台查看
  console.log('[HTTP] Original baseUrl from store:', baseUrl)

  if (baseUrl && baseUrl.trim() !== '') {
    let normalized = baseUrl.trim()
    // 如果没有协议头，自动添加 http://
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = 'http://' + normalized
      console.log('[HTTP] Auto-prefixed baseUrl:', normalized)
    }
    config.baseURL = normalized
  } else {
    // 空字符串表示使用代理
    config.baseURL = ''
    console.log('[HTTP] Using proxy mode (baseURL empty)')
  }

  const token = store.state.token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  res => res,
  err => {
    if (err.response && err.response.status === 401) {
      store.commit('logout')
    }
    return Promise.reject(err)
  }
)

export default http