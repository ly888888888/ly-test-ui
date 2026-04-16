module.exports = {
  devServer: {
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://172.17.7.156:5000',
        changeOrigin: true
      }
    },
    client: {
      overlay: {
        errors: true,
        warnings: false,
        runtimeErrors: (error) => {
          // 忽略 ResizeObserver 相关的错误
          if (error.message && error.message.includes('ResizeObserver loop')) {
            return false
          }
          return true
        }
      }
    }
  }
}