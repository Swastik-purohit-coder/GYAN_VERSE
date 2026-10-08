/**
 * GyanVerse Native Media Download Manager (expo-file-system)
 * Efficient chunk-based media downloader designed for low-RAM mobile devices.
 */

import * as FileSystem from 'expo-file-system';
import {
  saveOfflineMediaRecord,
  deleteOfflineMediaRecord,
  getOfflineMediaRecords,
} from '../storage/offlineDatabase';
import { useAppStore } from '../../store/useAppStore';
import { apiClient } from '../../services/apiClient';

const MEDIA_DIR = `${FileSystem.documentDirectory}media/`;

// Map of active download resumables
const activeDownloads: Map<string, FileSystem.DownloadResumable> = new Map();

/**
 * Ensures media storage directory exists
 */
export async function ensureMediaDirectory(): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(MEDIA_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(MEDIA_DIR, { intermediates: true });
  }
}

/**
 * Starts a native resumable download for a lesson media asset
 */
export async function startLessonDownload({
  lessonId,
  title,
  mediaType = 'video',
  onProgress,
}: {
  lessonId: string;
  title: string;
  mediaType?: 'video' | 'audio';
  onProgress?: (progressPercent: number) => void;
}): Promise<string> {
  await ensureMediaDirectory();

  const fileExt = mediaType === 'video' ? 'mp4' : 'mp3';
  const fileUri = `${MEDIA_DIR}${lessonId}.${fileExt}`;

  const remoteUrl =
    mediaType === 'video'
      ? apiClient.getVideoStreamUrl(lessonId)
      : apiClient.getAudioStreamUrl(lessonId);

  const downloadResumable = FileSystem.createDownloadResumable(
    remoteUrl,
    fileUri,
    {},
    (downloadProgress) => {
      const progress =
        downloadProgress.totalBytesExpectedToWrite > 0
          ? Math.round(
              (downloadProgress.totalBytesWritten /
                downloadProgress.totalBytesExpectedToWrite) *
                100
            )
          : 0;

      // Update Zustand store
      useAppStore.getState().setDownloadProgress(lessonId, progress);

      if (onProgress) {
        onProgress(progress);
      }
    }
  );

  activeDownloads.set(lessonId, downloadResumable);

  try {
    const result = await downloadResumable.downloadAsync();
    if (!result || !result.uri) {
      throw new Error('Download failed: No URI returned');
    }

    const fileInfo = await FileSystem.getInfoAsync(result.uri);
    const sizeBytes = fileInfo.exists && 'size' in fileInfo ? fileInfo.size || 0 : 0;

    // Save record to local SQLite
    await saveOfflineMediaRecord({
      id: `media_${lessonId}`,
      lessonId,
      type: mediaType,
      url: remoteUrl,
      title,
      localFilePath: result.uri,
      sizeBytes,
    });

    useAppStore.getState().removeDownloadProgress(lessonId);
    activeDownloads.delete(lessonId);

    return result.uri;
  } catch (error) {
    useAppStore.getState().removeDownloadProgress(lessonId);
    activeDownloads.delete(lessonId);
    console.warn(`[DownloadManager] Download failed for lesson ${lessonId}:`, error);
    throw error;
  }
}

/**
 * Pauses an active download
 */
export async function pauseLessonDownload(lessonId: string): Promise<string | null> {
  const download = activeDownloads.get(lessonId);
  if (download) {
    const snapshot = await download.pauseAsync();
    return JSON.stringify(snapshot);
  }
  return null;
}

/**
 * Cancels and cleans up an active download
 */
export async function cancelLessonDownload(lessonId: string): Promise<void> {
  const download = activeDownloads.get(lessonId);
  if (download) {
    await download.cancelAsync();
    activeDownloads.delete(lessonId);
    useAppStore.getState().removeDownloadProgress(lessonId);
  }
}

/**
 * Deletes a downloaded lesson file and removes SQLite registry record
 */
export async function deleteOfflineLesson(lessonId: string): Promise<void> {
  const records = await getOfflineMediaRecords();
  const record = records.find((r) => r.lessonId === lessonId);

  if (record && record.localFilePath) {
    const info = await FileSystem.getInfoAsync(record.localFilePath);
    if (info.exists) {
      await FileSystem.deleteAsync(record.localFilePath, { idempotent: true });
    }
    await deleteOfflineMediaRecord(record.id);
  }
}

/**
 * Calculates total storage used by offline media in megabytes
 */
export async function calculateOfflineStorageUsedMB(): Promise<number> {
  const records = await getOfflineMediaRecords();
  const totalBytes = records.reduce((sum, r) => sum + (r.sizeBytes || 0), 0);
  return Number((totalBytes / (1024 * 1024)).toFixed(2));
}

/**
 * Checks if a specific lesson is downloaded locally and returns its local file URI
 */
export async function getLocalLessonMediaUri(lessonId: string): Promise<string | null> {
  const records = await getOfflineMediaRecords();
  const record = records.find((r) => r.lessonId === lessonId);

  if (record && record.localFilePath) {
    const info = await FileSystem.getInfoAsync(record.localFilePath);
    if (info.exists) {
      return record.localFilePath;
    }
  }

  return null;
}
