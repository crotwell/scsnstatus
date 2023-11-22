
// vite.config.js
import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        cellstat: resolve(__dirname, 'cellstat/index.html'),
        batterystat: resolve(__dirname, 'batterystat/index.html'),
        stations: resolve(__dirname, 'stations/index.html'),
        scearthquakes: resolve(__dirname, 'scearthquakes/index.html'),
      },
    },
  },
})
