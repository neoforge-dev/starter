/**
 * API Service for making requests to the backend
 */
export const apiService = {
  /**
   * Get all projects
   * @returns {Promise<Object>} Projects data
   */
  async getProjects() {
    try {
      const response = await fetch("/api/projects");
      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching projects:", error);
      throw error;
    }
  },

  /**
   * Get a single project by ID
   * @param {string} id Project ID
   * @returns {Promise<Object>} Project data
   */
  async getProject(id) {
    try {
      const response = await fetch(`/api/projects/${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch project with ID ${id}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching project ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new project
   * @param {Object} project Project data
   * @returns {Promise<Object>} Created project
   */
  async createProject(project) {
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(project),
      });
      if (!response.ok) {
        throw new Error("Failed to create project");
      }
      return await response.json();
    } catch (error) {
      console.error("Error creating project:", error);
      throw error;
    }
  },

  /**
   * Update an existing project
   * @param {string} id Project ID
   * @param {Object} project Project data
   * @returns {Promise<Object>} Updated project
   */
  async updateProject(id, project) {
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(project),
      });
      if (!response.ok) {
        throw new Error(`Failed to update project with ID ${id}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error updating project ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a project
   * @param {string} id Project ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteProject(id) {
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`Failed to delete project with ID ${id}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error deleting project ${id}:`, error);
      throw error;
    }
  },
};
