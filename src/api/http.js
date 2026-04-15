import axios from 'axios'
import store from '../store'

const http = axios.create({
  timeout: 20000
})

http.interceptors.request.use(config => {
  const baseUrl = store.state.baseUrl
  if (baseUrl && /^https?:\/\//i.test(baseUrl)) {
    config.baseURL = baseUrl
  } else {
    // Use devServer proxy for /api in development
    config.baseURL = ''
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
