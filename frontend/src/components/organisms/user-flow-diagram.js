import { LitElement, html, css } from 'lit';
import { apiService as api } from '../../services/api.js';

/**
 * User Flow Diagram Component (Organism)
 * Interactive journey visualization using D3.js-like functionality
 * Shows user paths, common flows, and drop-off points
 * @element user-flow-diagram
 */
export class UserFlowDiagram extends LitElement {
  static get properties() {
    return {
      data: { type: Array },
      timeRange: { type: String },
      viewMode: { type: String },
      selectedPath: { type: Object },
      highlightedNode: { type: Object },
      loading: { type: Boolean },
      width: { type: Number },
      height: { type: Number },
      zoomLevel: { type: Number },
      showMetrics: { type: Boolean },
      minFlowThreshold: { type: Number },
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
        width: 100%;
        height: 100%;
        background: var(--surface-color, #fff);
        border-radius: 8px;
        border: 1px solid var(--border-color, #e0e0e0);
        overflow: hidden;
      }

      .flow-container {
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      .flow-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid var(--border-color, #e0e0e0);
        background: var(--background-color, #f8f9fa);
      }

      .flow-title {
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--text-primary-color, #333);
        margin: 0;
      }

      .flow-controls {
        display: flex;
        gap: 0.5rem;
        align-items: center;
      }

      .control-group {
        display: flex;
        align-items: center;
        gap: 0.25rem;
      }

      .control-label {
        font-size: 0.875rem;
        color: var(--text-secondary-color, #666);
      }

      .control-select,
      .control-slider {
        padding: 0.25rem 0.5rem;
        border: 1px solid var(--border-color, #e0e0e0);
        border-radius: 4px;
        background: var(--input-background, #fff);
        font-size: 0.875rem;
      }

      .control-slider {
        width: 80px;
      }

      .toggle-button {
        padding: 0.25rem 0.5rem;
        font-size: 0.875rem;
        background: var(--secondary-color, #f8f9fa);
        border: 1px solid var(--border-color, #e0e0e0);
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .toggle-button:hover {
        background: var(--hover-color, #e9ecef);
      }

      .toggle-button.active {
        background: var(--primary-color, #007bff);
        color: white;
        border-color: var(--primary-color, #007bff);
      }

      .flow-viewport {
        flex: 1;
        position: relative;
        overflow: hidden;
        background: linear-gradient(45deg, #f8f9fa 25%, transparent 25%),
                    linear-gradient(-45deg, #f8f9fa 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, #f8f9fa 75%),
                    linear-gradient(-45deg, transparent 75%, #f8f9fa 75%);
        background-size: 20px 20px;
        background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
      }

      .flow-canvas {
        width: 100%;
        height: 100%;
        position: relative;
        cursor: grab;
        transform-origin: 0 0;
        transition: transform 0.2s ease;
      }

      .flow-canvas:active {
        cursor: grabbing;
      }

      .flow-node {
        position: absolute;
        background: var(--surface-color, #fff);
        border: 2px solid var(--border-color, #e0e0e0);
        border-radius: 8px;
        padding: 0.75rem;
        min-width: 120px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        cursor: pointer;
        transition: all 0.2s ease;
        user-select: none;
      }

      .flow-node:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10;
      }

      .flow-node.highlighted {
        border-color: var(--primary-color, #007bff);
        background: var(--primary-light, #e3f2fd);
        box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.3);
        z-index: 5;
      }

      .flow-node.start-node {
        border-color: var(--success-color, #28a745);
        background: var(--success-light, #d4edda);
      }

      .flow-node.end-node {
        border-color: var(--danger-color, #dc3545);
        background: var(--danger-light, #f8d7da);
      }

      .node-title {
        font-weight: 600;
        font-size: 0.875rem;
        color: var(--text-primary-color, #333);
        margin-bottom: 0.25rem;
        line-height: 1.2;
      }

      .node-metrics {
        font-size: 0.75rem;
        color: var(--text-secondary-color, #666);
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }

      .node-metric {
        display: flex;
        justify-content: space-between;
      }

      .metric-value {
        font-weight: 600;
        color: var(--text-primary-color, #333);
      }

      .flow-edge {
        position: absolute;
        z-index: 1;
      }

      .edge-line {
        stroke: var(--border-color, #e0e0e0);
        stroke-width: 2;
        fill: none;
        transition: all 0.2s ease;
      }

      .edge-line.highlighted {
        stroke: var(--primary-color, #007bff);
        stroke-width: 3;
      }

      .edge-line.thick {
        stroke-width: 4;
      }

      .edge-line.medium {
        stroke-width: 3;
      }

      .edge-arrow {
        fill: var(--border-color, #e0e0e0);
        transition: all 0.2s ease;
      }

      .edge-arrow.highlighted {
        fill: var(--primary-color, #007bff);
      }

      .edge-label {
        position: absolute;
        background: rgba(255, 255, 255, 0.9);
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-primary-color, #333);
        border: 1px solid var(--border-color, #e0e0e0);
        pointer-events: none;
        z-index: 2;
      }

      .loading-spinner {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 300px;
        color: var(--text-secondary-color, #666);
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 300px;
        color: var(--text-secondary-color, #666);
        gap: 1rem;
      }

      .empty-icon {
        font-size: 3rem;
        opacity: 0.5;
      }

      .path-details {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid var(--border-color, #e0e0e0);
        border-radius: 8px;
        padding: 1rem;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 100;
      }

      .path-title {
        font-weight: 600;
        font-size: 0.9rem;
        color: var(--text-primary-color, #333);
        margin-bottom: 0.5rem;
        border-bottom: 1px solid var(--border-color, #e0e0e0);
        padding-bottom: 0.25rem;
      }

      .path-steps {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .path-step {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.8rem;
        padding: 0.25rem 0;
      }

      .step-name {
        color: var(--text-primary-color, #333);
      }

      .step-count {
        color: var(--text-secondary-color, #666);
        font-weight: 600;
      }

      .zoom-controls {
        position: absolute;
        bottom: 1rem;
        left: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .zoom-button {
        width: 32px;
        height: 32px;
        border: 1px solid var(--border-color, #e0e0e0);
        background: var(--surface-color, #fff);
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        transition: all 0.2s ease;
      }

      .zoom-button:hover {
        background: var(--hover-color, #e9ecef);
      }

      .legend {
        position: absolute;
        bottom: 1rem;
        right: 1rem;
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid var(--border-color, #e0e0e0);
        border-radius: 8px;
        padding: 0.75rem;
        font-size: 0.75rem;
      }

      .legend-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.25rem;
      }

      .legend-item:last-child {
        margin-bottom: 0;
      }

      .legend-marker {
        width: 16px;
        height: 2px;
        border-radius: 1px;
      }

      .legend-marker.thick {
        height: 4px;
        background: var(--success-color, #28a745);
      }

      .legend-marker.medium {
        height: 3px;
        background: var(--warning-color, #ffc107);
      }

      .legend-marker.thin {
        height: 2px;
        background: var(--border-color, #e0e0e0);
      }

      /* Responsive design */
      @media (max-width: 768px) {
        .flow-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 0.5rem;
        }

        .flow-controls {
          flex-wrap: wrap;
        }

        .path-details {
          position: relative;
          top: 0;
          right: 0;
          margin: 1rem;
          max-width: none;
        }
      }
    `;
  }

  constructor() {
    super();
    this.data = [];
    this.timeRange = '7d';
    this.viewMode = 'sankey'; // 'sankey', 'force', 'hierarchical'
    this.selectedPath = null;
    this.highlightedNode = null;
    this.loading = false;
    this.width = 800;
    this.height = 600;
    this.zoomLevel = 1;
    this.showMetrics = true;
    this.minFlowThreshold = 5;
    
    // Flow data
    this.nodes = new Map();
    this.edges = [];
    this.paths = [];
    
    // Interaction state
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.panOffset = { x: 0, y: 0 };
    
    this.resizeObserver = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this.loadFlowData();
    this.setupResizeObserver();
    this.addEventListener('mousemove', this.handleMouseMove);
    this.addEventListener('mousedown', this.handleMouseDown);
    this.addEventListener('mouseup', this.handleMouseUp);
    this.addEventListener('wheel', this.handleWheel, { passive: false });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    this.removeEventListener('mousemove', this.handleMouseMove);
    this.removeEventListener('mousedown', this.handleMouseDown);
    this.removeEventListener('mouseup', this.handleMouseUp);
    this.removeEventListener('wheel', this.handleWheel);
  }

  setupResizeObserver() {
    if ('ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          this.width = width;
          this.height = height - 100; // Account for header
          this.requestUpdate();
        }
      });
      this.resizeObserver.observe(this);
    }
  }

  async loadFlowData() {
    this.loading = true;
    
    try {
      const flowData = await this.fetchFlowAnalytics();
      this.processFlowData(flowData);
      this.generateLayout();
      
    } catch (error) {
      console.error('[UserFlowDiagram] Error loading flow data:', error);
    } finally {
      this.loading = false;
    }
  }

  async fetchFlowAnalytics() {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (this.timeRange) {
      case '1d':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      default:
        startDate.setDate(endDate.getDate() - 7);
    }

    // Fetch session-based journey data
    const response = await api.get('/api/v1/events/analytics', {
      params: {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        group_by: ['session_id', 'page_path', 'event_type'],
        order_by: ['timestamp'],
      }
    });

    return response.data;
  }

  processFlowData(analyticsData) {
    const sessionFlows = new Map();
    const pageNodes = new Map();
    const transitions = new Map();

    // Group events by session
    analyticsData.results.forEach(event => {
      const sessionId = event.dimensions.session_id;
      if (!sessionId) return;

      if (!sessionFlows.has(sessionId)) {
        sessionFlows.set(sessionId, []);
      }
      
      sessionFlows.get(sessionId).push({
        path: event.dimensions.page_path || '/',
        type: event.dimensions.event_type,
        count: event.count,
        timestamp: event.dimensions.timestamp,
      });
    });

    // Process session flows to build nodes and edges
    sessionFlows.forEach((events, sessionId) => {
      // Sort events by timestamp
      events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      // Create nodes for each page
      events.forEach(event => {
        const pageKey = event.path;
        if (!pageNodes.has(pageKey)) {
          pageNodes.set(pageKey, {
            id: pageKey,
            title: this.getPageTitle(pageKey),
            path: pageKey,
            visits: 0,
            uniqueSessions: new Set(),
            avgTimeOnPage: 0,
            bounceRate: 0,
            type: this.getNodeType(pageKey),
          });
        }
        
        const node = pageNodes.get(pageKey);
        node.visits += event.count;
        node.uniqueSessions.add(sessionId);
      });

      // Create transitions between pages
      for (let i = 0; i < events.length - 1; i++) {
        const fromPage = events[i].path;
        const toPage = events[i + 1].path;
        
        if (fromPage === toPage) continue; // Skip self-loops
        
        const transitionKey = `${fromPage} -> ${toPage}`;
        if (!transitions.has(transitionKey)) {
          transitions.set(transitionKey, {
            from: fromPage,
            to: toPage,
            count: 0,
            sessions: new Set(),
          });
        }
        
        const transition = transitions.get(transitionKey);
        transition.count++;
        transition.sessions.add(sessionId);
      }
    });

    // Convert to arrays and filter by threshold
    this.nodes = new Map();
    pageNodes.forEach((node, key) => {
      if (node.uniqueSessions.size >= this.minFlowThreshold) {
        node.uniqueSessions = node.uniqueSessions.size;
        this.nodes.set(key, node);
      }
    });

    this.edges = Array.from(transitions.values())
      .filter(edge => edge.sessions.size >= this.minFlowThreshold)
      .map(edge => ({
        ...edge,
        sessions: edge.sessions.size,
        percentage: 0, // Will be calculated in layout
      }));

    // Calculate percentages and additional metrics
    this.calculateMetrics();
  }

  getPageTitle(path) {
    const titles = {
      '/': 'Home',
      '/login': 'Login',
      '/signup': 'Sign Up',
      '/dashboard': 'Dashboard',
      '/profile': 'Profile',
      '/settings': 'Settings',
      '/product': 'Product',
      '/checkout': 'Checkout',
      '/confirmation': 'Confirmation',
    };
    
    return titles[path] || path.replace(/\//g, '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown Page';
  }

  getNodeType(path) {
    if (path === '/') return 'start';
    if (['/checkout', '/confirmation', '/success'].includes(path)) return 'end';
    return 'intermediate';
  }

  calculateMetrics() {
    // Calculate outflow percentages for edges
    const outflowTotals = new Map();
    
    this.edges.forEach(edge => {
      if (!outflowTotals.has(edge.from)) {
        outflowTotals.set(edge.from, 0);
      }
      outflowTotals.set(edge.from, outflowTotals.get(edge.from) + edge.sessions);
    });

    this.edges.forEach(edge => {
      const totalOutflow = outflowTotals.get(edge.from) || 1;
      edge.percentage = (edge.sessions / totalOutflow) * 100;
    });

    // Calculate bounce rates for nodes
    this.nodes.forEach(node => {
      const outgoingEdges = this.edges.filter(e => e.from === node.path);
      const totalSessions = node.uniqueSessions;
      const sessionsWithNextPage = outgoingEdges.reduce((sum, e) => sum + e.sessions, 0);
      node.bounceRate = totalSessions > 0 ? ((totalSessions - sessionsWithNextPage) / totalSessions) * 100 : 0;
    });
  }

  generateLayout() {
    if (this.viewMode === 'sankey') {
      this.generateSankeyLayout();
    } else if (this.viewMode === 'force') {
      this.generateForceLayout();
    } else {
      this.generateHierarchicalLayout();
    }
  }

  generateSankeyLayout() {
    // Simple Sankey-like layout
    const layers = new Map();
    const visited = new Set();
    
    // Identify layers using BFS
    const queue = [];
    
    // Find start nodes (nodes with no incoming edges)
    this.nodes.forEach(node => {
      const hasIncoming = this.edges.some(e => e.to === node.path);
      if (!hasIncoming || node.type === 'start') {
        layers.set(0, layers.get(0) || []);
        layers.get(0).push(node);
        queue.push({ node, layer: 0 });
      }
    });

    // BFS to assign layers
    while (queue.length > 0) {
      const { node, layer } = queue.shift();
      if (visited.has(node.path)) continue;
      visited.add(node.path);

      const outgoingEdges = this.edges.filter(e => e.from === node.path);
      outgoingEdges.forEach(edge => {
        const targetNode = this.nodes.get(edge.to);
        if (targetNode && !visited.has(targetNode.path)) {
          const nextLayer = layer + 1;
          if (!layers.has(nextLayer)) {
            layers.set(nextLayer, []);
          }
          layers.get(nextLayer).push(targetNode);
          queue.push({ node: targetNode, layer: nextLayer });
        }
      });
    }

    // Position nodes
    const layerWidth = this.width / (layers.size || 1);
    const nodeHeight = 100;

    layers.forEach((nodesInLayer, layerIndex) => {
      const layerHeight = this.height / (nodesInLayer.length + 1);
      
      nodesInLayer.forEach((node, nodeIndex) => {
        node.x = layerIndex * layerWidth + 50;
        node.y = (nodeIndex + 1) * layerHeight - nodeHeight / 2;
        node.width = layerWidth * 0.7;
        node.height = nodeHeight;
      });
    });
  }

  generateForceLayout() {
    // Simple force-directed layout simulation
    const nodes = Array.from(this.nodes.values());
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    // Initialize positions
    nodes.forEach((node, index) => {
      const angle = (index / nodes.length) * 2 * Math.PI;
      const radius = Math.min(this.width, this.height) * 0.3;
      node.x = centerX + Math.cos(angle) * radius;
      node.y = centerY + Math.sin(angle) * radius;
      node.width = 150;
      node.height = 80;
    });

    // Simple force simulation (very basic)
    for (let iteration = 0; iteration < 50; iteration++) {
      // Repulsion between nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          
          if (distance < 200) {
            const force = 1000 / (distance * distance);
            const fx = (dx / distance) * force;
            const fy = (dy / distance) * force;
            
            nodes[i].x -= fx * 0.1;
            nodes[i].y -= fy * 0.1;
            nodes[j].x += fx * 0.1;
            nodes[j].y += fy * 0.1;
          }
        }
      }

      // Attraction along edges
      this.edges.forEach(edge => {
        const fromNode = this.nodes.get(edge.from);
        const toNode = this.nodes.get(edge.to);
        
        if (fromNode && toNode) {
          const dx = toNode.x - fromNode.x;
          const dy = toNode.y - fromNode.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          
          const force = distance * 0.01;
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;
          
          fromNode.x += fx * 0.5;
          fromNode.y += fy * 0.5;
          toNode.x -= fx * 0.5;
          toNode.y -= fy * 0.5;
        }
      });

      // Keep nodes within bounds
      nodes.forEach(node => {
        node.x = Math.max(50, Math.min(this.width - 150, node.x));
        node.y = Math.max(50, Math.min(this.height - 100, node.y));
      });
    }
  }

  generateHierarchicalLayout() {
    // Top-down hierarchical layout
    const levels = new Map();
    const visited = new Set();
    
    // Find root nodes and create levels
    this.nodes.forEach(node => {
      if (node.type === 'start') {
        levels.set(0, levels.get(0) || []);
        levels.get(0).push(node);
      }
    });

    // BFS to create hierarchy
    let currentLevel = 0;
    while (levels.has(currentLevel)) {
      const nextLevel = currentLevel + 1;
      
      levels.get(currentLevel).forEach(node => {
        if (visited.has(node.path)) return;
        visited.add(node.path);
        
        this.edges
          .filter(e => e.from === node.path)
          .forEach(edge => {
            const targetNode = this.nodes.get(edge.to);
            if (targetNode && !visited.has(targetNode.path)) {
              if (!levels.has(nextLevel)) {
                levels.set(nextLevel, []);
              }
              levels.get(nextLevel).push(targetNode);
            }
          });
      });
      
      currentLevel++;
    }

    // Position nodes
    const levelHeight = this.height / (levels.size || 1);
    
    levels.forEach((nodesInLevel, levelIndex) => {
      const nodeWidth = this.width / (nodesInLevel.length + 1);
      
      nodesInLevel.forEach((node, nodeIndex) => {
        node.x = (nodeIndex + 1) * nodeWidth - 75;
        node.y = levelIndex * levelHeight + 50;
        node.width = 150;
        node.height = 80;
      });
    });
  }

  handleMouseMove(event) {
    if (this.isDragging) {
      const dx = event.clientX - this.dragStart.x;
      const dy = event.clientY - this.dragStart.y;
      
      this.panOffset.x += dx;
      this.panOffset.y += dy;
      
      this.dragStart.x = event.clientX;
      this.dragStart.y = event.clientY;
      
      this.requestUpdate();
    }
  }

  handleMouseDown(event) {
    this.isDragging = true;
    this.dragStart.x = event.clientX;
    this.dragStart.y = event.clientY;
  }

  handleMouseUp(event) {
    this.isDragging = false;
  }

  handleWheel(event) {
    event.preventDefault();
    
    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    this.zoomLevel = Math.max(0.2, Math.min(3, this.zoomLevel * delta));
    
    this.requestUpdate();
  }

  handleNodeClick(node, event) {
    event.stopPropagation();
    
    if (this.highlightedNode === node) {
      this.highlightedNode = null;
      this.selectedPath = null;
    } else {
      this.highlightedNode = node;
      this.selectedPath = this.findPathsFromNode(node);
    }
    
    this.dispatchEvent(new CustomEvent('node-selected', {
      detail: { node, paths: this.selectedPath },
      bubbles: true,
      composed: true,
    }));
  }

  findPathsFromNode(node) {
    const paths = [];
    const visited = new Set();
    
    const dfs = (currentPath, currentNode) => {
      if (visited.has(currentNode.path) || currentPath.length > 5) {
        return;
      }
      
      visited.add(currentNode.path);
      currentPath.push(currentNode);
      
      const outgoingEdges = this.edges.filter(e => e.from === currentNode.path);
      
      if (outgoingEdges.length === 0) {
        paths.push([...currentPath]);
      } else {
        outgoingEdges.forEach(edge => {
          const nextNode = this.nodes.get(edge.to);
          if (nextNode) {
            dfs([...currentPath], nextNode);
          }
        });
      }
    };
    
    dfs([], node);
    return paths.slice(0, 5); // Limit to top 5 paths
  }

  handleViewModeChange(event) {
    this.viewMode = event.target.value;
    this.generateLayout();
  }

  handleThresholdChange(event) {
    this.minFlowThreshold = parseInt(event.target.value);
    this.loadFlowData();
  }

  toggleMetrics() {
    this.showMetrics = !this.showMetrics;
  }

  zoomIn() {
    this.zoomLevel = Math.min(3, this.zoomLevel * 1.2);
  }

  zoomOut() {
    this.zoomLevel = Math.max(0.2, this.zoomLevel * 0.8);
  }

  resetZoom() {
    this.zoomLevel = 1;
    this.panOffset = { x: 0, y: 0 };
  }

  getEdgeThickness(edge) {
    const maxSessions = Math.max(...this.edges.map(e => e.sessions));
    const ratio = edge.sessions / maxSessions;
    
    if (ratio > 0.7) return 'thick';
    if (ratio > 0.3) return 'medium';
    return 'thin';
  }

  renderEdge(edge) {
    const fromNode = this.nodes.get(edge.from);
    const toNode = this.nodes.get(edge.to);
    
    if (!fromNode || !toNode) return '';
    
    const x1 = fromNode.x + fromNode.width;
    const y1 = fromNode.y + fromNode.height / 2;
    const x2 = toNode.x;
    const y2 = toNode.y + toNode.height / 2;
    
    // Calculate control points for curved edges
    const midX = (x1 + x2) / 2;
    const curvature = Math.abs(y2 - y1) * 0.3;
    
    const pathD = `M ${x1} ${y1} Q ${midX} ${y1 - curvature} ${x2} ${y2}`;
    const thickness = this.getEdgeThickness(edge);
    
    const isHighlighted = this.highlightedNode && 
      (this.highlightedNode.path === edge.from || this.highlightedNode.path === edge.to);

    return html`
      <svg 
        class="flow-edge" 
        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;"
      >
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                  refX="10" refY="3.5" orient="auto">
            <polygon class="edge-arrow ${isHighlighted ? 'highlighted' : ''}" 
                     points="0 0, 10 3.5, 0 7" />
          </marker>
        </defs>
        <path 
          class="edge-line ${thickness} ${isHighlighted ? 'highlighted' : ''}"
          d="${pathD}"
          marker-end="url(#arrowhead)"
        />
      </svg>
      ${edge.percentage > 10 ? html`
        <div 
          class="edge-label"
          style="left: ${midX}px; top: ${(y1 + y2) / 2 - 10}px; transform: translateX(-50%);"
        >
          ${edge.percentage.toFixed(0)}%
        </div>
      ` : ''}
    `;
  }

  renderNode(node) {
    const isHighlighted = this.highlightedNode === node;
    const nodeClass = `flow-node ${node.type}-node ${isHighlighted ? 'highlighted' : ''}`;
    
    return html`
      <div 
        class="${nodeClass}"
        style="left: ${node.x}px; top: ${node.y}px; width: ${node.width}px; height: ${node.height}px;"
        @click=${(e) => this.handleNodeClick(node, e)}
      >
        <div class="node-title">${node.title}</div>
        ${this.showMetrics ? html`
          <div class="node-metrics">
            <div class="node-metric">
              <span>Visits:</span>
              <span class="metric-value">${node.visits.toLocaleString()}</span>
            </div>
            <div class="node-metric">
              <span>Sessions:</span>
              <span class="metric-value">${node.uniqueSessions.toLocaleString()}</span>
            </div>
            <div class="node-metric">
              <span>Bounce:</span>
              <span class="metric-value">${node.bounceRate.toFixed(0)}%</span>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  renderPathDetails() {
    if (!this.selectedPath || this.selectedPath.length === 0) return '';
    
    const mainPath = this.selectedPath[0]; // Show the first/main path
    
    return html`
      <div class="path-details">
        <div class="path-title">User Journey from ${this.highlightedNode.title}</div>
        <div class="path-steps">
          ${mainPath.map((step, index) => html`
            <div class="path-step">
              <span class="step-name">${index + 1}. ${step.title}</span>
              <span class="step-count">${step.uniqueSessions}</span>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  render() {
    if (this.loading) {
      return html`
        <div class="flow-container">
          <div class="loading-spinner">
            <div>Loading user flow data...</div>
          </div>
        </div>
      `;
    }

    if (this.nodes.size === 0) {
      return html`
        <div class="flow-container">
          <div class="empty-state">
            <div class="empty-icon">🔄</div>
            <div>No user flow data available</div>
            <div>Adjust the minimum flow threshold or check your time range</div>
          </div>
        </div>
      `;
    }

    const canvasStyle = `
      transform: scale(${this.zoomLevel}) translate(${this.panOffset.x}px, ${this.panOffset.y}px);
    `;

    return html`
      <div class="flow-container">
        <div class="flow-header">
          <h3 class="flow-title">User Flow Diagram</h3>
          <div class="flow-controls">
            <div class="control-group">
              <span class="control-label">View:</span>
              <select class="control-select" .value=${this.viewMode} @change=${this.handleViewModeChange}>
                <option value="sankey">Sankey</option>
                <option value="force">Force</option>
                <option value="hierarchical">Hierarchical</option>
              </select>
            </div>
            
            <div class="control-group">
              <span class="control-label">Min Flow:</span>
              <input 
                type="range" 
                class="control-slider"
                min="1" 
                max="50" 
                .value=${this.minFlowThreshold}
                @input=${this.handleThresholdChange}
              >
              <span>${this.minFlowThreshold}</span>
            </div>
            
            <button 
              class="toggle-button ${this.showMetrics ? 'active' : ''}"
              @click=${this.toggleMetrics}
            >
              Metrics
            </button>
          </div>
        </div>

        <div class="flow-viewport">
          <div class="flow-canvas" style=${canvasStyle}>
            ${this.edges.map(edge => this.renderEdge(edge))}
            ${Array.from(this.nodes.values()).map(node => this.renderNode(node))}
          </div>

          ${this.renderPathDetails()}

          <div class="zoom-controls">
            <button class="zoom-button" @click=${this.zoomIn}>+</button>
            <button class="zoom-button" @click=${this.zoomOut}>−</button>
            <button class="zoom-button" @click=${this.resetZoom}>⌂</button>
          </div>

          <div class="legend">
            <div class="legend-item">
              <div class="legend-marker thick"></div>
              <span>High Traffic</span>
            </div>
            <div class="legend-item">
              <div class="legend-marker medium"></div>
              <span>Medium Traffic</span>
            </div>
            <div class="legend-item">
              <div class="legend-marker thin"></div>
              <span>Low Traffic</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('user-flow-diagram', UserFlowDiagram);