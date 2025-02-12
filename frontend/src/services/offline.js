import { toast } from "../components/ui/toast.js";

export class OfflineManager {
  constructor() {
    this._initializeListeners();
    this._syncQueue = [];
  }

  _initializeListeners() {
    window.addEventListener("online", () => this._handleOnline());
    window.addEventListener("offline", () => this._handleOffline());
  }

  _handleOnline() {
    toast.success("You are back online");
    this._processSyncQueue();
  }

  _handleOffline() {
    toast.warning(
      "You are offline. Changes will sync when connection is restored."
    );
  }

  async _processSyncQueue() {
    while (this._syncQueue.length > 0) {
      const task = this._syncQueue.shift();
      try {
        await task();
      } catch (error) {
        console.error("Sync failed:", error);
        this._syncQueue.unshift(task); // Put failed task back
        break;
      }
    }
  }

  addToSyncQueue(task) {
    this._syncQueue.push(task);
  }

  isOnline() {
    return navigator.onLine;
  }
}

export const offlineManager = new OfflineManager();
