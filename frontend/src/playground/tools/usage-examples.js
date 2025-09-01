/**
 * Usage Examples
 *
 * Provides real-world usage scenarios for NeoForge components.
 * Critical for developers to understand practical applications.
 */

export class UsageExamples {
  constructor() {
    this.scenarios = this.initializeScenarios();
  }

  /**
   * Get real-world scenarios that developers actually build
   */
  getRealWorldScenarios() {
    return [
      {
        name: 'user-management-dashboard',
        description: 'Complete user management interface with CRUD operations',
        components: ['neo-table', 'neo-form-builder', 'neo-modal', 'neo-button', 'neo-card'],
        difficulty: 'intermediate',
        category: 'admin',
        fullExample: this.getUserManagementExample(),
        liveDemo: this.getUserManagementDemo(),
        codeFiles: this.getUserManagementFiles()
      },
      {
        name: 'e-commerce-product-catalog',
        description: 'Product catalog with filtering and pagination',
        components: ['neo-card', 'neo-pagination', 'neo-select', 'neo-button', 'neo-search'],
        difficulty: 'intermediate',
        category: 'e-commerce',
        fullExample: this.getEcommerceExample(),
        liveDemo: this.getEcommerceDemo(),
        codeFiles: this.getEcommerceFiles()
      },
      {
        name: 'blog-content-management',
        description: 'Content management system for blog posts',
        components: ['rich-text-editor', 'neo-form', 'file-upload', 'neo-table', 'neo-modal'],
        difficulty: 'advanced',
        category: 'content',
        fullExample: this.getBlogCMSExample(),
        liveDemo: this.getBlogCMSDemo(),
        codeFiles: this.getBlogCMSFiles()
      },
      {
        name: 'financial-dashboard',
        description: 'Financial data visualization and reporting',
        components: ['neo-data-grid', 'chart-component', 'neo-card', 'date-picker', 'neo-filter'],
        difficulty: 'advanced',
        category: 'analytics',
        fullExample: this.getFinancialExample(),
        liveDemo: this.getFinancialDemo(),
        codeFiles: this.getFinancialFiles()
      },
      {
        name: 'customer-support-portal',
        description: 'Customer support ticket management',
        components: ['neo-table', 'neo-form-builder', 'neo-modal', 'status-badge', 'priority-selector'],
        difficulty: 'intermediate',
        category: 'support',
        fullExample: this.getSupportExample(),
        liveDemo: this.getSupportDemo(),
        codeFiles: this.getSupportFiles()
      }
    ];
  }

  /**
   * Get scenario by name
   */
  getScenario(name) {
    return this.scenarios.find(scenario => scenario.name === name);
  }

  /**
   * Get scenarios by category
   */
  getScenariosByCategory(category) {
    return this.scenarios.filter(scenario => scenario.category === category);
  }

  /**
   * User Management Dashboard Example
   */
  getUserManagementExample() {
    return `
/**
 * User Management Dashboard
 * Complete CRUD interface for user administration
 */

class UserManagementDashboard {
  constructor() {
    this.users = this.loadUsers();
    this.currentUser = null;
    this.init();
  }

  init() {
    this.render();
    this.attachEventListeners();
  }

  render() {
    const container = document.getElementById('dashboard');
    container.innerHTML = \`
      <div class="dashboard-header">
        <h1>User Management</h1>
        <neo-button variant="primary" id="add-user-btn">
          Add New User
        </neo-button>
      </div>

      <div class="dashboard-content">
        <!-- User Statistics Cards -->
        <div class="stats-grid">
          <neo-card class="stat-card">
            <h3>Total Users</h3>
            <div class="stat-value">\${this.users.length}</div>
          </neo-card>

          <neo-card class="stat-card">
            <h3>Active Users</h3>
            <div class="stat-value">\${this.getActiveUsersCount()}</div>
          </neo-card>

          <neo-card class="stat-card">
            <h3>New This Month</h3>
            <div class="stat-value">\${this.getNewUsersThisMonth()}</div>
          </neo-card>
        </div>

        <!-- Users Table -->
        <neo-table
          id="users-table"
          data='\${JSON.stringify(this.users)}'
          columns='\${JSON.stringify(this.getTableColumns())}'
          sortable="true"
          filterable="true"
          pageable="true"
          page-size="10">
        </neo-table>
      </div>

      <!-- User Form Modal -->
      <neo-modal id="user-modal" title="User Details">
        <neo-form-builder
          id="user-form"
          fields='\${JSON.stringify(this.getFormFields())}'>
        </neo-form-builder>
      </neo-modal>
    \`;
  }

  getTableColumns() {
    return [
      { key: 'id', label: 'ID', sortable: true },
      { key: 'name', label: 'Name', sortable: true },
      { key: 'email', label: 'Email', sortable: true },
      { key: 'role', label: 'Role', sortable: true },
      { key: 'status', label: 'Status', sortable: true },
      { key: 'created', label: 'Created', sortable: true },
      {
        key: 'actions',
        label: 'Actions',
        render: (user) => \`
          <neo-button size="small" onclick="userDashboard.editUser(\${user.id})">
            Edit
          </neo-button>
          <neo-button size="small" variant="danger" onclick="userDashboard.deleteUser(\${user.id})">
            Delete
          </neo-button>
        \`
      }
    ];
  }

  getFormFields() {
    return [
      { type: 'text', name: 'name', label: 'Full Name', required: true },
      { type: 'email', name: 'email', label: 'Email Address', required: true },
      {
        type: 'select',
        name: 'role',
        label: 'Role',
        options: ['Admin', 'User', 'Manager'],
        required: true
      },
      {
        type: 'select',
        name: 'status',
        label: 'Status',
        options: ['Active', 'Inactive', 'Pending'],
        required: true
      },
      { type: 'textarea', name: 'notes', label: 'Notes', rows: 3 }
    ];
  }

  attachEventListeners() {
    document.getElementById('add-user-btn').addEventListener('click', () => {
      this.openUserModal();
    });

    document.getElementById('user-form').addEventListener('submit', (event) => {
      this.handleFormSubmit(event);
    });

    document.getElementById('users-table').addEventListener('row-action', (event) => {
      this.handleTableAction(event);
    });
  }

  editUser(userId) {
    this.currentUser = this.users.find(user => user.id === userId);
    this.openUserModal(this.currentUser);
  }

  deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.users = this.users.filter(user => user.id !== userId);
      this.saveUsers();
      this.refreshTable();
    }
  }

  openUserModal(user = null) {
    const modal = document.getElementById('user-modal');
    const form = document.getElementById('user-form');

    if (user) {
      form.setValues(user);
      modal.setAttribute('title', 'Edit User');
    } else {
      form.reset();
      modal.setAttribute('title', 'Add New User');
    }

    modal.show();
  }

  handleFormSubmit(event) {
    const formData = event.detail.data;

    if (this.currentUser) {
      // Update existing user
      Object.assign(this.currentUser, formData);
    } else {
      // Add new user
      const newUser = {
        id: Date.now(),
        ...formData,
        created: new Date().toISOString()
      };
      this.users.push(newUser);
    }

    this.saveUsers();
    this.refreshTable();
    document.getElementById('user-modal').hide();
    this.currentUser = null;
  }

  refreshTable() {
    const table = document.getElementById('users-table');
    table.setAttribute('data', JSON.stringify(this.users));
  }

  loadUsers() {
    // Simulate loading from API/localStorage
    return [
      { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active', created: '2024-01-15' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'Active', created: '2024-01-20' },
      { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Manager', status: 'Inactive', created: '2024-02-01' }
    ];
  }

  saveUsers() {
    // Simulate saving to API/localStorage
    localStorage.setItem('users', JSON.stringify(this.users));
  }

  getActiveUsersCount() {
    return this.users.filter(user => user.status === 'Active').length;
  }

  getNewUsersThisMonth() {
    const thisMonth = new Date().getMonth();
    return this.users.filter(user =>
      new Date(user.created).getMonth() === thisMonth
    ).length;
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.userDashboard = new UserManagementDashboard();
});
    `;
  }

  getUserManagementDemo() {
    return {
      url: '/playground/demos/user-management',
      description: 'Interactive demo of the user management dashboard',
      features: ['Add/edit/delete users', 'Table sorting and filtering', 'Form validation', 'Modal interactions']
    };
  }

  getUserManagementFiles() {
    return [
      {
        path: 'src/user-management.js',
        type: 'main',
        content: this.getUserManagementExample()
      },
      {
        path: 'src/user-management.css',
        type: 'styles',
        content: `
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  padding: 1.5rem;
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: var(--primary-color);
}
        `
      }
    ];
  }

  /**
   * E-commerce Product Catalog Example
   */
  getEcommerceExample() {
    return `
/**
 * E-commerce Product Catalog
 * Product browsing with filtering and search
 */

class ProductCatalog {
  constructor() {
    this.products = this.loadProducts();
    this.filters = {
      category: 'all',
      priceRange: 'all',
      sortBy: 'name'
    };
    this.currentPage = 1;
    this.pageSize = 12;
    this.init();
  }

  render() {
    const container = document.getElementById('catalog');
    container.innerHTML = \`
      <div class="catalog-header">
        <h1>Product Catalog</h1>
        <neo-search
          id="product-search"
          placeholder="Search products..."
          debounce="300">
        </neo-search>
      </div>

      <div class="catalog-filters">
        <neo-select
          id="category-filter"
          label="Category"
          value="\${this.filters.category}">
          <option value="all">All Categories</option>
          <option value="electronics">Electronics</option>
          <option value="clothing">Clothing</option>
          <option value="books">Books</option>
        </neo-select>

        <neo-select
          id="price-filter"
          label="Price Range"
          value="\${this.filters.priceRange}">
          <option value="all">All Prices</option>
          <option value="0-25">$0 - $25</option>
          <option value="25-50">$25 - $50</option>
          <option value="50-100">$50 - $100</option>
          <option value="100+">$100+</option>
        </neo-select>

        <neo-select
          id="sort-filter"
          label="Sort By"
          value="\${this.filters.sortBy}">
          <option value="name">Name</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="rating">Rating</option>
        </neo-select>
      </div>

      <div class="products-grid" id="products-grid">
        \${this.renderProducts()}
      </div>

      <neo-pagination
        id="catalog-pagination"
        total="\${this.getFilteredProducts().length}"
        page-size="\${this.pageSize}"
        current-page="\${this.currentPage}">
      </neo-pagination>
    \`;
  }

  renderProducts() {
    const filteredProducts = this.getFilteredProducts();
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    const pageProducts = filteredProducts.slice(startIndex, endIndex);

    return pageProducts.map(product => \`
      <neo-card class="product-card" data-product-id="\${product.id}">
        <img src="\${product.image}" alt="\${product.name}" class="product-image">
        <div class="product-info">
          <h3 class="product-name">\${product.name}</h3>
          <p class="product-description">\${product.description}</p>
          <div class="product-price">$\${product.price}</div>
          <div class="product-rating">
            \${this.renderStars(product.rating)} (\${product.reviews} reviews)
          </div>
          <neo-button variant="primary" onclick="catalog.addToCart(\${product.id})">
            Add to Cart
          </neo-button>
        </div>
      </neo-card>
    \`).join('');
  }

  getFilteredProducts() {
    let filtered = [...this.products];

    // Apply category filter
    if (this.filters.category !== 'all') {
      filtered = filtered.filter(p => p.category === this.filters.category);
    }

    // Apply price filter
    if (this.filters.priceRange !== 'all') {
      const [min, max] = this.filters.priceRange.split('-');
      filtered = filtered.filter(p => {
        if (max === '+') return p.price >= parseInt(min);
        return p.price >= parseInt(min) && p.price <= parseInt(max);
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (this.filters.sortBy) {
        case 'price-low': return a.price - b.price;
        case 'price-high': return b.price - a.price;
        case 'rating': return b.rating - a.rating;
        case 'name':
        default: return a.name.localeCompare(b.name);
      }
    });

    return filtered;
  }

  addToCart(productId) {
    // Simulate adding to cart
    console.log('Added product to cart:', productId);
    // Show success message
  }
}
    `;
  }

  getEcommerceDemo() {
    return {
      url: '/playground/demos/ecommerce-catalog',
      description: 'Interactive product catalog with filtering and pagination',
      features: ['Product search', 'Category filtering', 'Price filtering', 'Sorting options', 'Pagination']
    };
  }

  getEcommerceFiles() {
    return [
      {
        path: 'src/product-catalog.js',
        type: 'main',
        content: this.getEcommerceExample()
      }
    ];
  }

  /**
   * Blog Content Management Example
   */
  getBlogCMSExample() {
    return `
/**
 * Blog Content Management System
 * Complete CMS for blog post management
 */

class BlogCMS {
  constructor() {
    this.posts = this.loadPosts();
    this.currentPost = null;
    this.init();
  }

  render() {
    const container = document.getElementById('cms');
    container.innerHTML = \`
      <div class="cms-header">
        <h1>Blog Content Management</h1>
        <neo-button variant="primary" id="new-post-btn">
          New Post
        </neo-button>
      </div>

      <div class="cms-content">
        <neo-table
          id="posts-table"
          data='\${JSON.stringify(this.posts)}'
          columns='\${JSON.stringify(this.getPostsColumns())}'
          sortable="true"
          filterable="true">
        </neo-table>
      </div>

      <neo-modal id="post-modal" title="Edit Post" size="large">
        <neo-form id="post-form">
          <div class="form-field">
            <label for="post-title">Title</label>
            <input type="text" id="post-title" name="title" required>
          </div>

          <div class="form-field">
            <label for="post-slug">Slug</label>
            <input type="text" id="post-slug" name="slug" required>
          </div>

          <div class="form-field">
            <label for="post-excerpt">Excerpt</label>
            <textarea id="post-excerpt" name="excerpt" rows="3"></textarea>
          </div>

          <div class="form-field">
            <label for="post-content">Content</label>
            <rich-text-editor id="post-content" name="content"></rich-text-editor>
          </div>

          <div class="form-field">
            <label for="post-featured-image">Featured Image</label>
            <file-upload id="post-featured-image" name="featuredImage" accept="image/*"></file-upload>
          </div>

          <div class="form-actions">
            <neo-button type="submit" variant="primary">Save Post</neo-button>
            <neo-button type="button" id="cancel-btn">Cancel</neo-button>
          </div>
        </neo-form>
      </neo-modal>
    \`;
  }

  getPostsColumns() {
    return [
      { key: 'title', label: 'Title', sortable: true },
      { key: 'status', label: 'Status', sortable: true },
      { key: 'author', label: 'Author', sortable: true },
      { key: 'created', label: 'Created', sortable: true },
      { key: 'modified', label: 'Modified', sortable: true },
      {
        key: 'actions',
        label: 'Actions',
        render: (post) => \`
          <neo-button size="small" onclick="blogCMS.editPost(\${post.id})">Edit</neo-button>
          <neo-button size="small" onclick="blogCMS.viewPost(\${post.id})">View</neo-button>
          <neo-button size="small" variant="danger" onclick="blogCMS.deletePost(\${post.id})">Delete</neo-button>
        \`
      }
    ];
  }
}
    `;
  }

  getBlogCMSDemo() {
    return {
      url: '/playground/demos/blog-cms',
      description: 'Full-featured blog content management system',
      features: ['Rich text editing', 'Image uploads', 'Post management', 'Draft/publish workflow']
    };
  }

  getBlogCMSFiles() {
    return [
      {
        path: 'src/blog-cms.js',
        type: 'main',
        content: this.getBlogCMSExample()
      }
    ];
  }

  /**
   * Financial Dashboard Example
   */
  getFinancialExample() {
    return `
/**
 * Financial Dashboard
 * Data visualization and reporting for financial data
 */

class FinancialDashboard {
  constructor() {
    this.data = this.loadFinancialData();
    this.filters = {
      dateRange: 'last-30-days',
      account: 'all'
    };
    this.init();
  }

  render() {
    const container = document.getElementById('financial-dashboard');
    container.innerHTML = \`
      <div class="dashboard-header">
        <h1>Financial Dashboard</h1>
        <div class="dashboard-filters">
          <date-picker
            id="date-range-picker"
            range="true"
            value="\${this.getDateRange()}">
          </date-picker>

          <neo-filter
            id="account-filter"
            options='\${JSON.stringify(this.getAccountOptions())}'
            value="\${this.filters.account}">
          </neo-filter>
        </div>
      </div>

      <div class="dashboard-metrics">
        \${this.renderMetricCards()}
      </div>

      <div class="dashboard-charts">
        <div class="chart-container">
          <h3>Revenue Trend</h3>
          <chart-component
            type="line"
            data='\${JSON.stringify(this.getRevenueData())}'
            height="300">
          </chart-component>
        </div>

        <div class="chart-container">
          <h3>Expense Breakdown</h3>
          <chart-component
            type="pie"
            data='\${JSON.stringify(this.getExpenseData())}'
            height="300">
          </chart-component>
        </div>
      </div>

      <div class="dashboard-table">
        <h3>Recent Transactions</h3>
        <neo-data-grid
          id="transactions-grid"
          data='\${JSON.stringify(this.getTransactionsData())}'
          columns='\${JSON.stringify(this.getTransactionColumns())}'
          editable="true"
          exportable="true">
        </neo-data-grid>
      </div>
    \`;
  }
}
    `;
  }

  getFinancialDemo() {
    return {
      url: '/playground/demos/financial-dashboard',
      description: 'Advanced financial data visualization dashboard',
      features: ['Interactive charts', 'Data filtering', 'Excel export', 'Real-time updates']
    };
  }

  getFinancialFiles() {
    return [
      {
        path: 'src/financial-dashboard.js',
        type: 'main',
        content: this.getFinancialExample()
      }
    ];
  }

  /**
   * Customer Support Portal Example
   */
  getSupportExample() {
    return `
/**
 * Customer Support Portal
 * Ticket management and customer service interface
 */

class SupportPortal {
  constructor() {
    this.tickets = this.loadTickets();
    this.currentTicket = null;
    this.init();
  }

  render() {
    const container = document.getElementById('support-portal');
    container.innerHTML = \`
      <div class="portal-header">
        <h1>Customer Support Portal</h1>
        <neo-button variant="primary" id="new-ticket-btn">
          New Ticket
        </neo-button>
      </div>

      <div class="portal-stats">
        \${this.renderStatsCards()}
      </div>

      <div class="portal-content">
        <neo-table
          id="tickets-table"
          data='\${JSON.stringify(this.tickets)}'
          columns='\${JSON.stringify(this.getTicketColumns())}'
          sortable="true"
          filterable="true">
        </neo-table>
      </div>

      <neo-modal id="ticket-modal" title="Ticket Details" size="large">
        <neo-form-builder
          id="ticket-form"
          fields='\${JSON.stringify(this.getTicketFields())}'>
        </neo-form-builder>
      </neo-modal>
    \`;
  }

  getTicketColumns() {
    return [
      { key: 'id', label: 'Ticket #', sortable: true },
      { key: 'subject', label: 'Subject', sortable: true },
      { key: 'customer', label: 'Customer', sortable: true },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        render: (ticket) => \`<status-badge status="\${ticket.status}">\${ticket.status}</status-badge>\`
      },
      {
        key: 'priority',
        label: 'Priority',
        sortable: true,
        render: (ticket) => \`<priority-selector value="\${ticket.priority}" readonly></priority-selector>\`
      },
      { key: 'assignee', label: 'Assignee', sortable: true },
      { key: 'created', label: 'Created', sortable: true },
      {
        key: 'actions',
        label: 'Actions',
        render: (ticket) => \`
          <neo-button size="small" onclick="supportPortal.viewTicket(\${ticket.id})">View</neo-button>
          <neo-button size="small" onclick="supportPortal.editTicket(\${ticket.id})">Edit</neo-button>
        \`
      }
    ];
  }
}
    `;
  }

  getSupportDemo() {
    return {
      url: '/playground/demos/support-portal',
      description: 'Complete customer support ticket management system',
      features: ['Ticket tracking', 'Status management', 'Priority assignment', 'Customer communication']
    };
  }

  getSupportFiles() {
    return [
      {
        path: 'src/support-portal.js',
        type: 'main',
        content: this.getSupportExample()
      }
    ];
  }

  /**
   * Initialize scenarios
   */
  initializeScenarios() {
    return this.getRealWorldScenarios();
  }
}
