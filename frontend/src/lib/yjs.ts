'use client'

import * as Y from 'yjs'
import { IndexeddbPersistence } from 'y-indexeddb'

export function createYDoc(documentId: string): {
  ydoc: Y.Doc
  persistence: IndexeddbPersistence
} {
  const ydoc = new Y.Doc()
  const persistence = new IndexeddbPersistence(`doc-${documentId}`, ydoc)
  return { ydoc, persistence }
}
