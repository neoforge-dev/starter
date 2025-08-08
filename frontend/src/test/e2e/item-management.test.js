import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock API service for item management
class ItemManagementAPI {
  constructor() {
    this.baseUrl = '/api/v1/items';
    this.items = [];
    this.nextId = 1;
  }

  async createItem(itemData) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const newItem = {
      id: this.nextId++,
      ...itemData,
      owner_id: 1, // Mock user ID
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    this.items.push(newItem);
    return { data: newItem, status: 201 };
  }

  async getItems(params = {}) {
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const { skip = 0, limit = 100 } = params;
    const paginatedItems = this.items.slice(skip, skip + limit);
    
    return { data: paginatedItems, status: 200 };
  }

  async getItem(itemId) {
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const item = this.items.find(item => item.id === itemId);
    if (!item) {
      throw new Error('Item not found');
    }
    
    return { data: item, status: 200 };
  }

  async updateItem(itemId, updateData) {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const itemIndex = this.items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
      throw new Error('Item not found');
    }
    
    const updatedItem = {
      ...this.items[itemIndex],
      ...updateData,
      updated_at: new Date().toISOString()
    };
    
    this.items[itemIndex] = updatedItem;
    return { data: updatedItem, status: 200 };
  }

  async deleteItem(itemId) {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const itemIndex = this.items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
      throw new Error('Item not found');
    }
    
    this.items.splice(itemIndex, 1);
    return { status: 204 };
  }

  // Utility methods for testing
  reset() {
    this.items = [];
    this.nextId = 1;
  }

  seedTestData() {
    this.items = [
      {
        id: 1,
        title: 'Test Item 1',
        description: 'Description for test item 1',
        owner_id: 1,
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z'
      },
      {
        id: 2,
        title: 'Test Item 2',
        description: 'Description for test item 2',
        owner_id: 1,
        created_at: '2024-01-01T11:00:00Z',
        updated_at: '2024-01-01T11:00:00Z'
      }
    ];
    this.nextId = 3;
  }
}

// Mock UI Component for Item Management
class ItemManagerComponent {
  constructor() {
    this.api = new ItemManagementAPI();
    this.items = [];
    this.loading = false;
    this.error = null;
    this.selectedItem = null;
    this.editMode = false;
  }

  async loadItems() {
    this.loading = true;
    this.error = null;
    
    try {
      const response = await this.api.getItems();
      this.items = response.data;
      this.dispatchEvent('items-loaded', { items: this.items });
    } catch (error) {
      this.error = error.message;
      this.dispatchEvent('error', { error: this.error });
    } finally {
      this.loading = false;
    }
  }

  async createItem(itemData) {
    this.loading = true;
    this.error = null;
    
    try {
      const response = await this.api.createItem(itemData);
      this.items.push(response.data);
      this.dispatchEvent('item-created', { item: response.data });
      return response.data;
    } catch (error) {
      this.error = error.message;
      this.dispatchEvent('error', { error: this.error });
      throw error;
    } finally {
      this.loading = false;
    }
  }

  async updateItem(itemId, updateData) {
    this.loading = true;
    this.error = null;
    
    try {
      const response = await this.api.updateItem(itemId, updateData);
      const itemIndex = this.items.findIndex(item => item.id === itemId);
      if (itemIndex !== -1) {
        this.items[itemIndex] = response.data;
      }
      this.dispatchEvent('item-updated', { item: response.data });
      return response.data;
    } catch (error) {
      this.error = error.message;
      this.dispatchEvent('error', { error: this.error });
      throw error;
    } finally {
      this.loading = false;
    }
  }

  async deleteItem(itemId) {
    this.loading = true;
    this.error = null;
    
    try {
      await this.api.deleteItem(itemId);
      this.items = this.items.filter(item => item.id !== itemId);
      this.dispatchEvent('item-deleted', { itemId });
    } catch (error) {
      this.error = error.message;
      this.dispatchEvent('error', { error: this.error });
      throw error;
    } finally {
      this.loading = false;
    }
  }

  selectItem(itemId) {
    this.selectedItem = this.items.find(item => item.id === itemId);
    this.dispatchEvent('item-selected', { item: this.selectedItem });
  }

  enterEditMode(item = null) {
    this.editMode = true;
    if (item) {
      this.selectedItem = item;
    }
    this.dispatchEvent('edit-mode-entered', { item: this.selectedItem });
  }

  exitEditMode() {
    this.editMode = false;
    this.selectedItem = null;
    this.dispatchEvent('edit-mode-exited', {});
  }

  // Event system mock
  dispatchEvent(eventType, detail) {
    if (this.eventListeners && this.eventListeners[eventType]) {
      this.eventListeners[eventType].forEach(callback => callback(detail));
    }
  }

  addEventListener(eventType, callback) {
    if (!this.eventListeners) {
      this.eventListeners = {};
    }
    if (!this.eventListeners[eventType]) {
      this.eventListeners[eventType] = [];
    }
    this.eventListeners[eventType].push(callback);
  }

  removeEventListener(eventType, callback) {
    if (this.eventListeners && this.eventListeners[eventType]) {
      this.eventListeners[eventType] = this.eventListeners[eventType].filter(cb => cb !== callback);
    }
  }
}

describe('Item Management E2E Tests', () => {
  let itemManager;
  let api;

  beforeEach(() => {
    itemManager = new ItemManagerComponent();
    api = itemManager.api;
  });

  afterEach(() => {
    api.reset();
    vi.restoreAllMocks();
  });

  describe('Item CRUD Operations', () => {
    it('should create a new item successfully', async () => {
      // Arrange
      const newItemData = {
        title: 'New Test Item',
        description: 'This is a test item created via E2E test'
      };

      let createdItemEvent = null;
      itemManager.addEventListener('item-created', (detail) => {
        createdItemEvent = detail;
      });

      // Act
      const createdItem = await itemManager.createItem(newItemData);

      // Assert
      expect(createdItem).toBeTruthy();
      expect(createdItem.id).toBeTruthy();
      expect(createdItem.title).toBe(newItemData.title);
      expect(createdItem.description).toBe(newItemData.description);
      expect(createdItem.owner_id).toBe(1);
      expect(createdItem.created_at).toBeTruthy();
      expect(createdItem.updated_at).toBeTruthy();

      // Check event was fired
      expect(createdItemEvent).toBeTruthy();
      expect(createdItemEvent.item.id).toBe(createdItem.id);

      // Check item was added to local state
      expect(itemManager.items).toHaveLength(1);
      expect(itemManager.items[0].id).toBe(createdItem.id);
    });

    it('should load all items for the user', async () => {
      // Arrange
      api.seedTestData();

      let itemsLoadedEvent = null;
      itemManager.addEventListener('items-loaded', (detail) => {
        itemsLoadedEvent = detail;
      });

      // Act
      await itemManager.loadItems();

      // Assert
      expect(itemManager.items).toHaveLength(2);
      expect(itemManager.items[0].title).toBe('Test Item 1');
      expect(itemManager.items[1].title).toBe('Test Item 2');
      expect(itemManager.loading).toBe(false);
      expect(itemManager.error).toBeNull();

      // Check event was fired
      expect(itemsLoadedEvent).toBeTruthy();
      expect(itemsLoadedEvent.items).toHaveLength(2);
    });

    it('should update an existing item', async () => {
      // Arrange
      api.seedTestData();
      await itemManager.loadItems();

      const itemToUpdate = itemManager.items[0];
      const updateData = {
        title: 'Updated Test Item',
        description: 'Updated description'
      };

      let itemUpdatedEvent = null;
      itemManager.addEventListener('item-updated', (detail) => {
        itemUpdatedEvent = detail;
      });

      // Act
      const updatedItem = await itemManager.updateItem(itemToUpdate.id, updateData);

      // Assert
      expect(updatedItem.id).toBe(itemToUpdate.id);
      expect(updatedItem.title).toBe(updateData.title);
      expect(updatedItem.description).toBe(updateData.description);
      expect(updatedItem.updated_at).not.toBe(itemToUpdate.updated_at);

      // Check local state was updated
      const localItem = itemManager.items.find(item => item.id === itemToUpdate.id);
      expect(localItem.title).toBe(updateData.title);
      expect(localItem.description).toBe(updateData.description);

      // Check event was fired
      expect(itemUpdatedEvent).toBeTruthy();
      expect(itemUpdatedEvent.item.id).toBe(updatedItem.id);
    });

    it('should delete an item', async () => {
      // Arrange
      api.seedTestData();
      await itemManager.loadItems();

      const itemToDelete = itemManager.items[0];
      const initialItemCount = itemManager.items.length;

      let itemDeletedEvent = null;
      itemManager.addEventListener('item-deleted', (detail) => {
        itemDeletedEvent = detail;
      });

      // Act
      await itemManager.deleteItem(itemToDelete.id);

      // Assert
      expect(itemManager.items).toHaveLength(initialItemCount - 1);
      expect(itemManager.items.find(item => item.id === itemToDelete.id)).toBeUndefined();

      // Check event was fired
      expect(itemDeletedEvent).toBeTruthy();
      expect(itemDeletedEvent.itemId).toBe(itemToDelete.id);

      // Verify item is also deleted from API
      await expect(api.getItem(itemToDelete.id)).rejects.toThrow('Item not found');
    });
  });

  describe('Item Selection and Editing Workflow', () => {
    beforeEach(async () => {
      api.seedTestData();
      await itemManager.loadItems();
    });

    it('should handle item selection correctly', async () => {
      // Arrange
      const itemToSelect = itemManager.items[0];

      let itemSelectedEvent = null;
      itemManager.addEventListener('item-selected', (detail) => {
        itemSelectedEvent = detail;
      });

      // Act
      itemManager.selectItem(itemToSelect.id);

      // Assert
      expect(itemManager.selectedItem).toBeTruthy();
      expect(itemManager.selectedItem.id).toBe(itemToSelect.id);
      expect(itemManager.selectedItem.title).toBe(itemToSelect.title);

      // Check event was fired
      expect(itemSelectedEvent).toBeTruthy();
      expect(itemSelectedEvent.item.id).toBe(itemToSelect.id);
    });

    it('should handle edit mode workflow', async () => {
      // Arrange
      const itemToEdit = itemManager.items[0];

      let editModeEnteredEvent = null;
      let editModeExitedEvent = null;

      itemManager.addEventListener('edit-mode-entered', (detail) => {
        editModeEnteredEvent = detail;
      });

      itemManager.addEventListener('edit-mode-exited', (detail) => {
        editModeExitedEvent = detail;
      });

      // Act - Enter edit mode
      itemManager.enterEditMode(itemToEdit);

      // Assert - Edit mode entered
      expect(itemManager.editMode).toBe(true);
      expect(itemManager.selectedItem.id).toBe(itemToEdit.id);
      expect(editModeEnteredEvent).toBeTruthy();
      expect(editModeEnteredEvent.item.id).toBe(itemToEdit.id);

      // Act - Exit edit mode
      itemManager.exitEditMode();

      // Assert - Edit mode exited
      expect(itemManager.editMode).toBe(false);
      expect(itemManager.selectedItem).toBeNull();
      expect(editModeExitedEvent).toBeTruthy();
    });

    it('should handle complete edit workflow', async () => {
      // Arrange
      const itemToEdit = itemManager.items[0];
      const originalTitle = itemToEdit.title;

      // Act - Complete edit workflow
      itemManager.selectItem(itemToEdit.id);
      itemManager.enterEditMode(itemToEdit);

      const updateData = {
        title: 'Edited via workflow',
        description: 'Updated through complete workflow'
      };

      const updatedItem = await itemManager.updateItem(itemToEdit.id, updateData);
      itemManager.exitEditMode();

      // Assert
      expect(updatedItem.title).toBe(updateData.title);
      expect(updatedItem.title).not.toBe(originalTitle);
      expect(itemManager.editMode).toBe(false);
      expect(itemManager.selectedItem).toBeNull();

      // Verify the item was actually updated in the API
      const fetchedItem = await api.getItem(itemToEdit.id);
      expect(fetchedItem.data.title).toBe(updateData.title);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle API errors during item creation', async () => {
      // Arrange
      const invalidItemData = {
        title: '', // Empty title should cause validation error
        description: 'Test description'
      };

      // Mock API to throw error
      vi.spyOn(api, 'createItem').mockRejectedValue(new Error('Validation failed: Title is required'));

      let errorEvent = null;
      itemManager.addEventListener('error', (detail) => {
        errorEvent = detail;
      });

      // Act & Assert
      await expect(itemManager.createItem(invalidItemData)).rejects.toThrow('Validation failed: Title is required');

      expect(itemManager.error).toBe('Validation failed: Title is required');
      expect(itemManager.loading).toBe(false);
      expect(errorEvent).toBeTruthy();
      expect(errorEvent.error).toBe('Validation failed: Title is required');
    });

    it('should handle network errors during item loading', async () => {
      // Arrange
      vi.spyOn(api, 'getItems').mockRejectedValue(new Error('Network error'));

      let errorEvent = null;
      itemManager.addEventListener('error', (detail) => {
        errorEvent = detail;
      });

      // Act
      await itemManager.loadItems();

      // Assert
      expect(itemManager.error).toBe('Network error');
      expect(itemManager.loading).toBe(false);
      expect(itemManager.items).toHaveLength(0);
      expect(errorEvent).toBeTruthy();
      expect(errorEvent.error).toBe('Network error');
    });

    it('should handle attempting to update non-existent item', async () => {
      // Arrange
      const nonExistentItemId = 999;
      const updateData = { title: 'Updated title' };

      let errorEvent = null;
      itemManager.addEventListener('error', (detail) => {
        errorEvent = detail;
      });

      // Act & Assert
      await expect(itemManager.updateItem(nonExistentItemId, updateData)).rejects.toThrow('Item not found');

      expect(itemManager.error).toBe('Item not found');
      expect(itemManager.loading).toBe(false);
      expect(errorEvent).toBeTruthy();
      expect(errorEvent.error).toBe('Item not found');
    });

    it('should handle attempting to delete non-existent item', async () => {
      // Arrange
      const nonExistentItemId = 999;

      let errorEvent = null;
      itemManager.addEventListener('error', (detail) => {
        errorEvent = detail;
      });

      // Act & Assert
      await expect(itemManager.deleteItem(nonExistentItemId)).rejects.toThrow('Item not found');

      expect(itemManager.error).toBe('Item not found');
      expect(itemManager.loading).toBe(false);
      expect(errorEvent).toBeTruthy();
      expect(errorEvent.error).toBe('Item not found');
    });
  });

  describe('Pagination and Large Dataset Handling', () => {
    beforeEach(() => {
      // Seed with many items
      api.items = Array.from({ length: 150 }, (_, index) => ({
        id: index + 1,
        title: `Item ${index + 1}`,
        description: `Description for item ${index + 1}`,
        owner_id: 1,
        created_at: new Date(Date.now() - (150 - index) * 60000).toISOString(),
        updated_at: new Date(Date.now() - (150 - index) * 60000).toISOString()
      }));
      api.nextId = 151;
    });

    it('should handle pagination correctly', async () => {
      // Test first page
      const firstPageResponse = await api.getItems({ skip: 0, limit: 50 });
      expect(firstPageResponse.data).toHaveLength(50);
      expect(firstPageResponse.data[0].title).toBe('Item 1');

      // Test second page
      const secondPageResponse = await api.getItems({ skip: 50, limit: 50 });
      expect(secondPageResponse.data).toHaveLength(50);
      expect(secondPageResponse.data[0].title).toBe('Item 51');

      // Test last page (partial)
      const lastPageResponse = await api.getItems({ skip: 100, limit: 100 });
      expect(lastPageResponse.data).toHaveLength(50);
      expect(lastPageResponse.data[0].title).toBe('Item 101');
    });

    it('should handle concurrent operations correctly', async () => {
      // Arrange
      api.seedTestData();
      await itemManager.loadItems();

      const createPromise = itemManager.createItem({
        title: 'Concurrent Create',
        description: 'Created concurrently'
      });

      const updatePromise = itemManager.updateItem(1, {
        title: 'Concurrent Update'
      });

      const deletePromise = itemManager.deleteItem(2);

      // Act - Execute operations concurrently
      const [createdItem, updatedItem] = await Promise.all([
        createPromise,
        updatePromise,
        deletePromise
      ]);

      // Assert
      expect(createdItem.title).toBe('Concurrent Create');
      expect(updatedItem.title).toBe('Concurrent Update');
      expect(itemManager.items).toHaveLength(2); // 1 created, 1 updated, 1 deleted = 2 total
      expect(itemManager.items.find(item => item.id === 2)).toBeUndefined(); // Deleted item
    });
  });

  describe('Performance and Optimization', () => {
    it('should handle operations within acceptable time limits', async () => {
      // Arrange
      const startTime = Date.now();
      
      const itemData = {
        title: 'Performance Test Item',
        description: 'Testing operation performance'
      };

      // Act
      const createdItem = await itemManager.createItem(itemData);
      const fetchedItem = await api.getItem(createdItem.id);
      const updatedItem = await itemManager.updateItem(createdItem.id, { title: 'Updated Performance Test' });
      await itemManager.deleteItem(createdItem.id);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Assert - All operations should complete within 1 second
      expect(totalTime).toBeLessThan(1000);
    });

    it('should maintain state consistency across operations', async () => {
      // Arrange
      api.seedTestData();
      await itemManager.loadItems();

      const initialItemCount = itemManager.items.length;
      const initialApiItemCount = api.items.length;

      // Act - Perform multiple operations
      const newItem = await itemManager.createItem({
        title: 'Consistency Test',
        description: 'Testing state consistency'
      });

      await itemManager.updateItem(newItem.id, {
        title: 'Updated Consistency Test'
      });

      await itemManager.deleteItem(1); // Delete existing item

      // Assert - State should be consistent
      expect(itemManager.items.length).toBe(initialItemCount); // Same count (1 added, 1 deleted)
      expect(api.items.length).toBe(initialApiItemCount); // Same count in API
      
      // Verify the new item exists with updated title
      const updatedNewItem = itemManager.items.find(item => item.id === newItem.id);
      expect(updatedNewItem.title).toBe('Updated Consistency Test');
      
      // Verify the deleted item is gone
      expect(itemManager.items.find(item => item.id === 1)).toBeUndefined();
    });
  });
});