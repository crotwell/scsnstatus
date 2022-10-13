const { resolve } = require('path')
const { defineConfig } = require('vite')

module.exports = defineConfig({
  base: '/scsn/status_new/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        cellstat: resolve(__dirname, 'cellstat/index.html'),
        batterystat: resolve(__dirname, 'batterystat/index.html'),
        stations: resolve(__dirname, 'stations/index.html'),
      }
    }
  }
})
