module.exports = {
  devServer: {
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://172.17.7.156:5000',
        changeOrigin: true
      }
    }
  }
}
