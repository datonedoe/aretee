import { File, Directory } from 'expo-file-system'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { FileService, StorageService } from './types'

export class NativeFileService implements FileService {
  async pickFolder(): Promise<string | null> {
    try {
      const dir = await Directory.pickDirectoryAsync()
      return dir.uri
    } catch {
      return null
    }
  }

  async readFile(path: string): Promise<string> {
    const file = new File(path)
    return file.text()
  }

  async writeFile(path: string, content: string): Promise<void> {
    const file = new File(path)
    file.write(content)
  }

  async listFiles(path: string, extension: string): Promise<string[]> {
    const results: string[] = []
    this.listFilesRecursive(new Directory(path), extension, results)
    return results
  }

  private listFilesRecursive(
    dir: Directory,
    extension: string,
    results: string[]
  ): void {
    try {
      const entries = dir.list()

      for (const entry of entries) {
        if (entry instanceof Directory) {
          this.listFilesRecursive(entry, extension, results)
        } else if (entry instanceof File && entry.name.endsWith(extension)) {
          results.push(entry.uri)
        }
      }
    } catch {
      // Skip directories we can't read
    }
  }
}

export class NativeStorageService implements StorageService {
  async get<T>(key: string): Promise<T | null> {
    const value = await AsyncStorage.getItem(key)
    if (value === null) return null
    return JSON.parse(value) as T
  }

  async set<T>(key: string, value: T): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value))
  }

  async delete(key: string): Promise<void> {
    await AsyncStorage.removeItem(key)
  }
}
