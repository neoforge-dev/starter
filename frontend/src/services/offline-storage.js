import { Logger } from '../utils/logger.js';

/**
 * Service for managing offline data storage and synchronization
 */
class OfflineStorageService {
  constructor() {
    this.dbName = 'neoforge-offline';
    this.dbVersion = 1;
    this.db = null;
    this.isOnline = navigator.onLine;
    this._setupEventListeners();
  }

  /**
   * Initialize the offline storage service
   */
  async initialize() {
    // Check if IndexedDB is available
    if (!this._isIndexedDBAvailable()) {
      Logger.warn('IndexedDB not available - offline storage disabled');
      return;
    }

    try {
      this.db = await this._openDatabase();
      Logger.info('Offline storage initialized');
      
      // Process any pending sync operations
      if (this.isOnline) {
        await this.syncPendingActions();
      }
    } catch (error) {
      Logger.error('Failed to initialize offline storage', error);
    }
  }

  /**
   * Store data for offline access
   * @param {string} key - Storage key
   * @param {any} data - Data to store
   * @param {number} ttl - Time to live in milliseconds (optional)
   */
  async setItem(key, data, ttl = null) {
    if (!this._isIndexedDBAvailable() || !this.db) {
      if (this._isIndexedDBAvailable()) {
        await this.initialize();
      }
      if (!this.db) {
        Logger.debug(`Cannot store offline data - IndexedDB unavailable: ${key}`);
        return;
      }
    }

    try {
      const tx = this.db.transaction(['cache'], 'readwrite');
      const store = tx.objectStore('cache');
      
      const item = {
        key,
        data,
        timestamp: Date.now(),
        ttl: ttl ? Date.now() + ttl : null
      };

      await this._promisifyRequest(store.put(item));
      Logger.debug(`Stored offline data for key: ${key}`);
    } catch (error) {
      Logger.error(`Failed to store offline data for key: ${key}`, error);
    }
  }

  /**
   * Retrieve data from offline storage
   * @param {string} key - Storage key
   * @returns {Promise<any|null>} Stored data or null if not found/expired
   */
  async getItem(key) {
    if (!this.db) {
      await this.initialize();
    }

    try {
      const tx = this.db.transaction(['cache'], 'readonly');
      const store = tx.objectStore('cache');
      const result = await this._promisifyRequest(store.get(key));

      if (!result) {
        return null;
      }

      // Check if item has expired
      if (result.ttl && Date.now() > result.ttl) {
        await this.removeItem(key);
        return null;
      }

      return result.data;
    } catch (error) {
      Logger.error(`Failed to retrieve offline data for key: ${key}`, error);
      return null;
    }
  }

  /**
   * Remove item from offline storage
   * @param {string} key - Storage key
   */
  async removeItem(key) {
    if (!this.db) {
      await this.initialize();
    }

    try {
      const tx = this.db.transaction(['cache'], 'readwrite');
      const store = tx.objectStore('cache');
      await this._promisifyRequest(store.delete(key));
      Logger.debug(`Removed offline data for key: ${key}`);
    } catch (error) {
      Logger.error(`Failed to remove offline data for key: ${key}`, error);
    }
  }

  /**
   * Queue an action to be performed when back online
   * @param {Object} action - Action to queue
   */
  async queueAction(action) {
    if (!this.db) {
      await this.initialize();
    }

    try {
      const tx = this.db.transaction(['offline_actions'], 'readwrite');
      const store = tx.objectStore('offline_actions');
      
      const queuedAction = {
        id: Date.now() + Math.random(),
        ...action,
        timestamp: Date.now()
      };

      await this._promisifyRequest(store.add(queuedAction));
      Logger.info(`Queued offline action: ${queuedAction.id}`);

      // Also queue in service worker
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'queueOfflineAction',
          action: queuedAction
        });
      }

      return queuedAction.id;
    } catch (error) {
      Logger.error('Failed to queue offline action', error);
      throw error;
    }
  }

  /**
   * Get all pending actions
   * @returns {Promise<Array>} Array of pending actions
   */
  async getPendingActions() {
    if (!this.db) {
      await this.initialize();
    }

    try {
      const tx = this.db.transaction(['offline_actions'], 'readonly');
      const store = tx.objectStore('offline_actions');
      return await this._promisifyRequest(store.getAll());
    } catch (error) {
      Logger.error('Failed to get pending actions', error);
      return [];
    }
  }

  /**
   * Remove completed action from queue
   * @param {string|number} actionId - Action ID to remove
   */
  async removeCompletedAction(actionId) {
    if (!this.db) {
      await this.initialize();
    }

    try {
      const tx = this.db.transaction(['offline_actions'], 'readwrite');
      const store = tx.objectStore('offline_actions');
      await this._promisifyRequest(store.delete(actionId));
      Logger.debug(`Removed completed action: ${actionId}`);
    } catch (error) {
      Logger.error(`Failed to remove completed action: ${actionId}`, error);
    }
  }

  /**
   * Sync all pending actions when back online
   */
  async syncPendingActions() {
    if (!this.isOnline) {
      Logger.debug('Cannot sync - still offline');
      return;
    }

    const pendingActions = await this.getPendingActions();
    Logger.info(`Syncing ${pendingActions.length} pending actions`);

    for (const action of pendingActions) {
      try {
        const response = await fetch(action.url, {
          method: action.method || 'GET',
          headers: action.headers || {},
          body: action.body
        });

        if (response.ok) {
          await this.removeCompletedAction(action.id);
          Logger.info(`Successfully synced action: ${action.id}`);
          
          // Dispatch custom event for successful sync
          window.dispatchEvent(new CustomEvent('offline-action-synced', {
            detail: { action, response }
          }));
        } else {
          Logger.warn(`Failed to sync action ${action.id}: ${response.status}`);
        }
      } catch (error) {
        Logger.warn(`Failed to sync action ${action.id}:`, error.message);
      }
    }
  }

  /**
   * Clear all cached data
   */
  async clearCache() {
    if (!this.db) {
      await this.initialize();
    }

    try {
      const tx = this.db.transaction(['cache'], 'readwrite');
      const store = tx.objectStore('cache');
      await this._promisifyRequest(store.clear());
      Logger.info('Cleared offline cache');
    } catch (error) {
      Logger.error('Failed to clear offline cache', error);
    }
  }

  /**
   * Get cache statistics
   * @returns {Promise<Object>} Cache statistics
   */
  async getCacheStats() {
    if (!this.db) {
      await this.initialize();
    }

    try {
      const [cacheCount, actionsCount] = await Promise.all([
        this._getStoreCount('cache'),
        this._getStoreCount('offline_actions')
      ]);

      return {
        cachedItems: cacheCount,
        pendingActions: actionsCount,
        isOnline: this.isOnline
      };
    } catch (error) {
      Logger.error('Failed to get cache stats', error);
      return { cachedItems: 0, pendingActions: 0, isOnline: this.isOnline };
    }
  }

  /**
   * Set up event listeners for online/offline detection
   */
  _setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      Logger.info('Back online - syncing pending actions');
      this.syncPendingActions();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      Logger.info('Gone offline - actions will be queued');
    });
  }

  /**
   * Open IndexedDB database
   * @returns {Promise<IDBDatabase>}
   */
  _openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create cache store
        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
          cacheStore.createIndex('timestamp', 'timestamp');
        }
        
        // Create offline actions store
        if (!db.objectStoreNames.contains('offline_actions')) {
          const actionsStore = db.createObjectStore('offline_actions', { keyPath: 'id' });
          actionsStore.createIndex('timestamp', 'timestamp');
        }
      };
    });
  }

  /**
   * Convert IDB request to promise
   * @param {IDBRequest} request
   * @returns {Promise}
   */
  _promisifyRequest(request) {
    return new Promise((resolve, reject) => {
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * Get count of items in a store
   * @param {string} storeName
   * @returns {Promise<number>}
   */
  async _getStoreCount(storeName) {
    const tx = this.db.transaction([storeName], 'readonly');
    const store = tx.objectStore(storeName);
    return await this._promisifyRequest(store.count());
  }

  /**
   * Check if IndexedDB is available
   * @returns {boolean}
   */
  _isIndexedDBAvailable() {
    return typeof indexedDB !== 'undefined' && indexedDB !== null;
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorageService();