export enum ReviewResponse {
  Again = 'Again',
  Hard = 'Hard',
  Good = 'Good',
  Easy = 'Easy',
}

export enum SyncStatus {
  Synced = 'synced',
  PendingSync = 'pendingSync',
  SyncFailed = 'syncFailed',
}

export const ResponseColors: Record<ReviewResponse, string> = {
  [ReviewResponse.Again]: '#F43F5E', // rose
  [ReviewResponse.Hard]: '#F59E0B', // amber
  [ReviewResponse.Good]: '#10B981', // emerald
  [ReviewResponse.Easy]: '#00E5FF', // electric cyan
}

export const ResponseKeyBindings: Record<string, ReviewResponse> = {
  '1': ReviewResponse.Again,
  '2': ReviewResponse.Hard,
  '3': ReviewResponse.Good,
  '4': ReviewResponse.Easy,
}
