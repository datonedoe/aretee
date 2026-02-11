export type Unsubscribe = () => void
export type FileChangeCallback = (event: { path: string; type: 'created' | 'modified' | 'deleted' }) => void

export interface FileService {
  pickFolder(): Promise<string | null>
  readFile(path: string): Promise<string>
  writeFile(path: string, content: string): Promise<void>
  listFiles(path: string, extension: string): Promise<string[]>
}

export interface StorageService {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T): Promise<void>
  delete(key: string): Promise<void>
}
