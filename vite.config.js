
// vite.config.js
import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  base: "/scsn/status_new/",
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        heli: resolve(__dirname, 'heli/index.html'),
        latency: resolve(__dirname, 'latency/index.html'),
        cellstat: resolve(__dirname, 'cellstat/index.html'),
        batterystat: resolve(__dirname, 'batterystat/index.html'),
        voltage: resolve(__dirname, 'voltage/index.html'),
        stations: resolve(__dirname, 'stations/index.html'),
        sohstream: resolve(__dirname, 'sohstreams/index.html'),
        scearthquakes: resolve(__dirname, 'scearthquakes/index.html'),
        about: resolve(__dirname, 'about/index.html'),
        contact: resolve(__dirname, 'contact/index.html'),
      },
    },
  },
})
