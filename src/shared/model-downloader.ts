/**
 * GitHub Model Auto-Downloader
 * 
 * Automatically download and cache models from GitHub releases
 * Inspired by ha-openwakeword's flexible distribution model
 * 
 * How it works:
 * 1. Check if models already cached locally
 * 2. If not, download from config.modelSources URLs
 * 3. Save to IndexedDB (web) or local storage (mobile)
 * 4. Auto-update on schedule (config.modelSources.updateInterval)
 */

import { EventEmitter } from 'events';
import { NatsuConfig } from './natsu-config';

export interface ModelMetadata {
  name: string;
  version: string;
  type: 'wake-word' | 'voice' | 'other';
  size: number;
  checksum: string;
  downloadedAt: number;
  url: string;
}

export interface ModelCache {
  models: Map<string, ModelMetadata>;
  lastUpdated: number;
}

/**
 * ModelDownloader: Auto-fetch and cache models
 */
export class ModelDownloader extends EventEmitter {
  private config: NatsuConfig;
  private modelCache: ModelCache = { models: new Map(), lastUpdated: 0 };
  private isDownloading = false;
  private db: IDBDatabase | null = null;

  constructor(config: NatsuConfig) {
    super();
    this.config = config;
  }

  /**
   * Initialize model downloader (setup IndexedDB)
   */
  async initialize(): Promise<void> {
    try {
      console.log('[ModelDownloader] Initializing...');

      // Try IndexedDB (web/mobile)
      if ('indexedDB' in window) {
        await this.initializeIndexedDB();
      } else {
        console.log('[ModelDownloader] IndexedDB not available, using localStorage');
      }

      // Load cached models
      await this.loadCachedModels();

      this.emit('initialized');
    } catch (error) {
      this.emit('error', { error, context: 'ModelDownloader initialization' });
    }
  }

  /**
   * Initialize IndexedDB for model storage
   */
  private async initializeIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('natsu-models', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('models')) {
          db.createObjectStore('models', { keyPath: 'name' });
        }
      };
    });
  }

  /**
   * Download models from GitHub releases
   * 
   * Example GitHub URL:
   * https://github.com/paras2l/natsu-models/releases/download/v1.0/wake-word-models.tflite
   */
  async downloadModels(): Promise<void> {
    if (this.isDownloading) {
      console.log('[ModelDownloader] Already downloading...');
      return;
    }

    this.isDownloading = true;
    this.emit('download-started');

    try {
      console.log('[ModelDownloader] Checking for model updates...');

      // Download wake word models
      if (this.config.modelSources.wakeWordModels) {
        await this.downloadModelFile(
          'wake-word',
          this.config.modelSources.wakeWordModels,
          'wake-word-models.tflite'
        );
      }

      // Download voice models
      if (this.config.modelSources.voiceModels) {
        await this.downloadModelFile(
          'voice',
          this.config.modelSources.voiceModels,
          'voice-models.tflite'
        );
      }

      this.modelCache.lastUpdated = Date.now();
      await this.saveCachedModels();

      console.log('[ModelDownloader] Models downloaded successfully');
      this.emit('download-completed');
    } catch (error) {
      this.emit('error', { error, context: 'Model download' });
      throw error;
    } finally {
      this.isDownloading = false;
    }
  }

  /**
   * Download single model file from GitHub
   */
  private async downloadModelFile(
    type: 'wake-word' | 'voice',
    gitHubUrl: string,
    fileName: string
  ): Promise<void> {
    try {
      console.log(`[ModelDownloader] Downloading ${type} model from ${gitHubUrl}`);

      // Parse GitHub URL to get release asset
      const releaseUrl = this.parseGitHubUrl(gitHubUrl);
      
      const response = await fetch(releaseUrl);
      if (!response.ok) {
        throw new Error(`Failed to download: ${response.statusText}`);
      }

      const blob = await response.blob();
      const checksum = await this.computeChecksum(blob);

      const metadata: ModelMetadata = {
        name: fileName,
        version: this.getVersionFromUrl(gitHubUrl),
        type,
        size: blob.size,
        checksum,
        downloadedAt: Date.now(),
        url: releaseUrl,
      };

      // Store in cache
      this.modelCache.models.set(fileName, metadata);

      // Save to IndexedDB if available
      if (this.db) {
        await this.saveModelToIndexedDB(fileName, blob, metadata);
      } else {
        await this.saveModelToLocalStorage(fileName, blob, metadata);
      }

      this.emit('model-downloaded', { fileName, size: blob.size });
    } catch (error) {
      this.emit('error', { error, context: `Download ${type} model` });
      throw error;
    }
  }

  /**
   * Get model as ArrayBuffer (for inference)
   */
  async getModel(fileName: string): Promise<ArrayBuffer | null> {
    try {
      // Try IndexedDB first
      if (this.db) {
        const buffer = await this.getModelFromIndexedDB(fileName);
        if (buffer) return buffer;
      }

      // Fallback to localStorage
      const data = localStorage.getItem(`natsu-model-${fileName}`);
      if (data) {
        return this.base64ToArrayBuffer(data);
      }

      console.warn(`[ModelDownloader] Model not found: ${fileName}`);
      return null;
    } catch (error) {
      this.emit('error', { error, context: 'Get model' });
      return null;
    }
  }

  /**
   * Check if model needs update
   */
  shouldUpdateModels(): boolean {
    const now = Date.now();
    const lastUpdated = this.modelCache.lastUpdated;
    const updateInterval = this.config.modelSources.updateInterval * 1000; // ms

    return now - lastUpdated > updateInterval;
  }

  /**
   * List all cached models
   */
  listCachedModels(): ModelMetadata[] {
    return Array.from(this.modelCache.models.values());
  }

  /**
   * Clear model cache
   */
  async clearCache(): Promise<void> {
    this.modelCache.models.clear();
    localStorage.clear();

    if (this.db) {
      const request = this.db
        .transaction('models', 'readwrite')
        .objectStore('models')
        .clear();
      
      await new Promise((resolve) => {
        request.onsuccess = () => resolve(null);
      });
    }

    this.emit('cache-cleared');
  }

  /**
   * Save model to IndexedDB
   */
  private async saveModelToIndexedDB(
    fileName: string,
    blob: Blob,
    metadata: ModelMetadata
  ): Promise<void> {
    if (!this.db) return;

    const arrayBuffer = await blob.arrayBuffer();
    const data = { fileName, arrayBuffer, metadata };

    return new Promise((resolve, reject) => {
      const request = this.db!
        .transaction('models', 'readwrite')
        .objectStore('models')
        .put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get model from IndexedDB
   */
  private async getModelFromIndexedDB(fileName: string): Promise<ArrayBuffer | null> {
    if (!this.db) return null;

    return new Promise((resolve) => {
      const request = this.db!
        .transaction('models', 'readonly')
        .objectStore('models')
        .get(fileName);

      request.onsuccess = () => {
        const data = request.result;
        resolve(data ? data.arrayBuffer : null);
      };

      request.onerror = () => resolve(null);
    });
  }

  /**
   * Save model to localStorage (fallback)
   */
  private async saveModelToLocalStorage(
    fileName: string,
    blob: Blob,
    metadata: ModelMetadata
  ): Promise<void> {
    const arrayBuffer = await blob.arrayBuffer();
    const base64 = this.arrayBufferToBase64(arrayBuffer);
    localStorage.setItem(`natsu-model-${fileName}`, base64);
    localStorage.setItem(`natsu-model-meta-${fileName}`, JSON.stringify(metadata));
  }

  /**
   * Load cached models from storage
   */
  private async loadCachedModels(): Promise<void> {
    try {
      // Load from localStorage
      for (const key in localStorage) {
        if (key.startsWith('natsu-model-meta-')) {
          const metadata = JSON.parse(localStorage.getItem(key) || '{}');
          if (metadata.name) {
            this.modelCache.models.set(metadata.name, metadata);
          }
        }
      }

      console.log(`[ModelDownloader] Loaded ${this.modelCache.models.size} cached models`);
    } catch (error) {
      console.error('[ModelDownloader] Error loading cached models:', error);
    }
  }

  /**
   * Save cached models to persistent storage
   */
  private async saveCachedModels(): Promise<void> {
    const metadataArray = Array.from(this.modelCache.models.values());
    localStorage.setItem('natsu-model-cache', JSON.stringify(metadataArray));
  }

  /**
   * Parse GitHub URL to release asset URL
   */
  private parseGitHubUrl(url: string): string {
    // Input: https://github.com/paras2l/natsu-models/releases/tag/v1.0
    // Output: https://github.com/paras2l/natsu-models/releases/download/v1.0/wake-word-models.tflite

    // For now, return as-is (assumes direct asset URL)
    // In production, parse release API
    return url;
  }

  /**
   * Get version from GitHub URL
   */
  private getVersionFromUrl(url: string): string {
    const match = url.match(/v[\d.]+/);
    return match ? match[0] : 'unknown';
  }

  /**
   * Compute SHA256 checksum of blob
   */
  private async computeChecksum(blob: Blob): Promise<string> {
    const buffer = await blob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Convert ArrayBuffer to Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

export function createModelDownloader(config: NatsuConfig): ModelDownloader {
  return new ModelDownloader(config);
}
