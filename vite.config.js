import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  base: '/GPT-Codex-Dealership/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        inventory: resolve(__dirname, 'inventory.html'),
        collection: resolve(__dirname, 'collection.html'),
        gallery: resolve(__dirname, 'gallery.html'),
        craftsmanship: resolve(__dirname, 'craftsmanship.html'),
        concierge: resolve(__dirname, 'concierge.html'),
        ownership: resolve(__dirname, 'ownership.html'),
        contact: resolve(__dirname, 'contact.html'),
        confirmation: resolve(__dirname, 'confirmation.html')
      }
    }
  }
})
