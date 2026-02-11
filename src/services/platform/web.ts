import { FileService, StorageService } from './types'

/* eslint-disable @typescript-eslint/no-explicit-any */

export class WebFileService implements FileService {
  private directoryHandle: any = null

  async pickFolder(): Promise<string | null> {
    try {
      const handle = await (window as any).showDirectoryPicker({
        mode: 'readwrite',
      })
      this.directoryHandle = handle
      return handle.name
    } catch {
      return null
    }
  }

  async readFile(path: string): Promise<string> {
    if (!this.directoryHandle) {
      throw new Error('No directory selected. Call pickFolder() first.')
    }

    const parts = path.split('/')
    let current = this.directoryHandle

    for (let i = 0; i < parts.length - 1; i++) {
      current = await current.getDirectoryHandle(parts[i])
    }

    const fileHandle = await current.getFileHandle(parts[parts.length - 1])
    const file = await fileHandle.getFile()
    return file.text()
  }

  async writeFile(path: string, content: string): Promise<void> {
    if (!this.directoryHandle) {
      throw new Error('No directory selected. Call pickFolder() first.')
    }

    const parts = path.split('/')
    let current = this.directoryHandle

    for (let i = 0; i < parts.length - 1; i++) {
      current = await current.getDirectoryHandle(parts[i], { create: true })
    }

    const fileHandle = await current.getFileHandle(parts[parts.length - 1], { create: true })
    const writable = await fileHandle.createWritable()
    await writable.write(content)
    await writable.close()
  }

  async listFiles(path: string, extension: string): Promise<string[]> {
    if (!this.directoryHandle) {
      throw new Error('No directory selected. Call pickFolder() first.')
    }

    let startDir = this.directoryHandle
    if (path && path !== this.directoryHandle.name) {
      const parts = path.split('/')
      for (const part of parts) {
        try {
          startDir = await startDir.getDirectoryHandle(part)
        } catch {
          return []
        }
      }
    }

    const results: string[] = []
    await this.listFilesRecursive(startDir, '', extension, results)
    return results
  }

  private async listFilesRecursive(
    dir: any,
    prefix: string,
    extension: string,
    results: string[]
  ): Promise<void> {
    for await (const [name, handle] of dir.entries()) {
      const fullPath = prefix ? `${prefix}/${name}` : name
      if (handle.kind === 'directory') {
        await this.listFilesRecursive(handle, fullPath, extension, results)
      } else if (name.endsWith(extension)) {
        results.push(fullPath)
      }
    }
  }
}

export class WebStorageService implements StorageService {
  async get<T>(key: string): Promise<T | null> {
    const value = localStorage.getItem(key)
    if (value === null) return null
    return JSON.parse(value) as T
  }

  async set<T>(key: string, value: T): Promise<void> {
    localStorage.setItem(key, JSON.stringify(value))
  }

  async delete(key: string): Promise<void> {
    localStorage.removeItem(key)
  }
}
