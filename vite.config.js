const { resolve } = require('path')
const { defineConfig } = require('vite')

module.exports = defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        cellstat: resolve(__dirname, 'cellstat/index.html')
      }
    }
  }
})
