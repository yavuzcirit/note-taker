import path from 'path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: [
    'yjs',
    'y-protocols',
    'y-indexeddb',
    'lib0',
    '@tiptap/extension-collaboration',
    '@tiptap/extension-collaboration-cursor',
  ],
  turbopack: {
    root: path.resolve(__dirname),
  },
}

export default nextConfig
