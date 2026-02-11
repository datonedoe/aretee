import { Platform } from 'react-native'
import { FileService, StorageService } from './types'

export type { FileService, StorageService } from './types'

let _fileService: FileService | null = null
let _storageService: StorageService | null = null

export function getFileService(): FileService {
  if (!_fileService) {
    if (Platform.OS === 'web') {
      const { WebFileService } = require('./web')
      _fileService = new WebFileService()
    } else {
      const { NativeFileService } = require('./native')
      _fileService = new NativeFileService()
    }
  }
  return _fileService!
}

export function getStorageService(): StorageService {
  if (!_storageService) {
    if (Platform.OS === 'web') {
      const { WebStorageService } = require('./web')
      _storageService = new WebStorageService()
    } else {
      const { NativeStorageService } = require('./native')
      _storageService = new NativeStorageService()
    }
  }
  return _storageService!
}
