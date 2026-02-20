import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      // Point react-native to a lightweight stub so Vite never touches RN's Flow source.
      // Tests that need specific Platform behavior use vi.mock('react-native', ...) which
      // overrides this alias at runtime.
      'react-native': path.resolve(__dirname, 'src/__tests__/mocks/react-native.ts'),
    },
  },
  test: {
    include: ['src/__tests__/**/*.test.ts'],
  },
})
