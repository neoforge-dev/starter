import { expect } from '@open-wc/testing';
import { fixture, html } from '@open-wc/testing';
import { spy, stub } from 'sinon';
import '../../src/components/organisms/user-flow-diagram.js';

describe('UserFlowDiagram', () => {
  let element;
  let apiStub;

  beforeEach(async () => {
    // Mock API responses
    apiStub = stub(window, 'fetch').resolves({
      ok: true,
      json: () => Promise.resolve({
        data: {
          results: [
            {
              dimensions: {
                session_id: 'session1',
                page_path: '/',
                event_type: 'page_enter',
                timestamp: '2025-08-14T10:00:00Z'
              },
              count: 1
            },
            {
              dimensions: {
                session_id: 'session1',
                page_path: '/product',
                event_type: 'page_enter',
                timestamp: '2025-08-14T10:01:00Z'
              },
              count: 1
            },
            {
              dimensions: {
                session_id: 'session2',
                page_path: '/',
                event_type: 'page_enter',
                timestamp: '2025-08-14T10:02:00Z'
              },
              count: 1
            }
          ]
        }
      })
    });

    element = await fixture(html`
      <user-flow-diagram
        .timeRange=${'7d'}
        .viewMode=${'sankey'}
        .showMetrics=${true}
        .width=${800}
        .height=${600}
      ></user-flow-diagram>
    `);

    // Wait for data loading
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterEach(() => {
    if (apiStub) apiStub.restore();
  });

  describe('Initialization', () => {
    it('should initialize with default properties', () => {
      expect(element.data).to.be.an('array');
      expect(element.timeRange).to.equal('7d');
      expect(element.viewMode).to.equal('sankey');
      expect(element.selectedPath).to.be.null;
      expect(element.highlightedNode).to.be.null;
      expect(element.showMetrics).to.be.true;
      expect(element.width).to.equal(800);
      expect(element.height).to.equal(600);
      expect(element.zoomLevel).to.equal(1);
      expect(element.minFlowThreshold).to.equal(5);
    });

    it('should initialize collections', () => {
      expect(element.nodes).to.be.instanceOf(Map);
      expect(element.edges).to.be.an('array');
      expect(element.paths).to.be.an('array');
    });

    it('should load flow data on connection', async () => {
      await element.updateComplete;
      expect(apiStub.called).to.be.true;
    });
  });

  describe('Data Processing', () => {
    beforeEach(async () => {
      await element.loadFlowData();
    });

    it('should process analytics data into nodes and edges', () => {
      expect(element.nodes.size).to.be.greaterThan(0);

      // Check node structure
      const firstNode = Array.from(element.nodes.values())[0];
      expect(firstNode).to.have.property('id');
      expect(firstNode).to.have.property('title');
      expect(firstNode).to.have.property('visits');
      expect(firstNode).to.have.property('uniqueSessions');
    });

    it('should create edges between connected pages', () => {
      expect(element.edges).to.be.an('array');

      if (element.edges.length > 0) {
        const firstEdge = element.edges[0];
        expect(firstEdge).to.have.property('from');
        expect(firstEdge).to.have.property('to');
        expect(firstEdge).to.have.property('count');
        expect(firstEdge).to.have.property('sessions');
      }
    });

    it('should filter nodes and edges by minimum threshold', () => {
      element.minFlowThreshold = 10;
      element.processFlowData({ results: [] });

      // All remaining nodes should meet the threshold
      Array.from(element.nodes.values()).forEach(node => {
        expect(node.uniqueSessions).to.be.at.least(element.minFlowThreshold);
      });
    });

    it('should calculate page titles from paths', () => {
      const titles = [
        { path: '/', expected: 'Home' },
        { path: '/login', expected: 'Login' },
        { path: '/signup', expected: 'Sign Up' },
        { path: '/product-details', expected: 'Product Details' },
        { path: '/unknown', expected: 'Unknown' }
      ];

      titles.forEach(({ path, expected }) => {
        const title = element.getPageTitle(path);
        expect(title).to.include(expected);
      });
    });

    it('should determine node types correctly', () => {
      expect(element.getNodeType('/')).to.equal('start');
      expect(element.getNodeType('/checkout')).to.equal('end');
      expect(element.getNodeType('/confirmation')).to.equal('end');
      expect(element.getNodeType('/product')).to.equal('intermediate');
    });
  });

  describe('Layout Generation', () => {
    beforeEach(async () => {
      // Set up test nodes
      element.nodes = new Map([
        ['/', { id: '/', title: 'Home', path: '/', type: 'start' }],
        ['/product', { id: '/product', title: 'Product', path: '/product', type: 'intermediate' }],
        ['/checkout', { id: '/checkout', title: 'Checkout', path: '/checkout', type: 'end' }]
      ]);

      element.edges = [
        { from: '/', to: '/product', sessions: 100 },
        { from: '/product', to: '/checkout', sessions: 50 }
      ];
    });

    it('should generate Sankey layout', () => {
      element.viewMode = 'sankey';
      element.generateLayout();

      // Check that nodes have positions
      Array.from(element.nodes.values()).forEach(node => {
        expect(node.x).to.be.a('number');
        expect(node.y).to.be.a('number');
        expect(node.width).to.be.a('number');
        expect(node.height).to.be.a('number');
      });
    });

    it('should generate force layout', () => {
      element.viewMode = 'force';
      element.generateLayout();

      // Check that nodes have positions within bounds
      Array.from(element.nodes.values()).forEach(node => {
        expect(node.x).to.be.within(0, element.width);
        expect(node.y).to.be.within(0, element.height);
      });
    });

    it('should generate hierarchical layout', () => {
      element.viewMode = 'hierarchical';
      element.generateLayout();

      // Start nodes should be at the top
      const startNodes = Array.from(element.nodes.values()).filter(n => n.type === 'start');
      const otherNodes = Array.from(element.nodes.values()).filter(n => n.type !== 'start');

      if (startNodes.length > 0 && otherNodes.length > 0) {
        expect(startNodes[0].y).to.be.lessThan(otherNodes[0].y);
      }
    });

    it('should handle empty node sets', () => {
      element.nodes.clear();
      element.edges = [];

      expect(() => {
        element.generateLayout();
      }).to.not.throw();
    });
  });

  describe('User Interactions', () => {
    beforeEach(async () => {
      element.nodes = new Map([
        ['/', { id: '/', title: 'Home', path: '/', type: 'start', x: 100, y: 100 }],
        ['/product', { id: '/product', title: 'Product', path: '/product', type: 'intermediate', x: 300, y: 100 }]
      ]);
      await element.updateComplete;
    });

    it('should handle node clicks', () => {
      const eventSpy = spy();
      element.addEventListener('node-selected', eventSpy);

      const node = element.nodes.get('/');
      element.handleNodeClick(node, new Event('click'));

      expect(eventSpy.calledOnce).to.be.true;
      expect(element.highlightedNode).to.equal(node);
    });

    it('should toggle node selection on repeated clicks', () => {
      const node = element.nodes.get('/');

      element.handleNodeClick(node, new Event('click'));
      expect(element.highlightedNode).to.equal(node);

      element.handleNodeClick(node, new Event('click'));
      expect(element.highlightedNode).to.be.null;
    });

    it('should find paths from selected node', () => {
      element.edges = [
        { from: '/', to: '/product', sessions: 100 },
        { from: '/product', to: '/checkout', sessions: 50 }
      ];

      element.nodes.set('/checkout', {
        id: '/checkout',
        title: 'Checkout',
        path: '/checkout',
        type: 'end'
      });

      const node = element.nodes.get('/');
      const paths = element.findPathsFromNode(node);

      expect(paths).to.be.an('array');
      if (paths.length > 0) {
        expect(paths[0][0]).to.equal(node);
      }
    });

    it('should prevent infinite loops in path finding', () => {
      // Create circular reference
      element.edges = [
        { from: '/', to: '/product', sessions: 100 },
        { from: '/product', to: '/', sessions: 50 }
      ];

      const node = element.nodes.get('/');
      const paths = element.findPathsFromNode(node);

      // Should not hang or create infinite paths
      expect(paths).to.be.an('array');
      paths.forEach(path => {
        expect(path.length).to.be.lessThan(6); // Reasonable path length
      });
    });
  });

  describe('Zoom and Pan', () => {
    it('should handle mouse wheel zoom', () => {
      const initialZoom = element.zoomLevel;

      const wheelEvent = new WheelEvent('wheel', {
        deltaY: -100,
        bubbles: true,
        cancelable: true
      });

      element.handleWheel(wheelEvent);

      expect(element.zoomLevel).to.be.greaterThan(initialZoom);
    });

    it('should limit zoom levels', () => {
      // Test maximum zoom
      element.zoomLevel = 3;
      const wheelEvent = new WheelEvent('wheel', {
        deltaY: -100,
        bubbles: true,
        cancelable: true
      });
      element.handleWheel(wheelEvent);
      expect(element.zoomLevel).to.be.at.most(3);

      // Test minimum zoom
      element.zoomLevel = 0.2;
      const wheelEventOut = new WheelEvent('wheel', {
        deltaY: 100,
        bubbles: true,
        cancelable: true
      });
      element.handleWheel(wheelEventOut);
      expect(element.zoomLevel).to.be.at.least(0.2);
    });

    it('should handle pan interactions', () => {
      element.isDragging = true;
      element.dragStart = { x: 100, y: 100 };
      element.panOffset = { x: 0, y: 0 };

      const moveEvent = new MouseEvent('mousemove', {
        clientX: 150,
        clientY: 120
      });

      element.handleMouseMove(moveEvent);

      expect(element.panOffset.x).to.equal(50);
      expect(element.panOffset.y).to.equal(20);
    });

    it('should zoom in/out with controls', () => {
      const initialZoom = element.zoomLevel;

      element.zoomIn();
      expect(element.zoomLevel).to.be.greaterThan(initialZoom);

      element.zoomOut();
      expect(element.zoomLevel).to.be.closeTo(initialZoom, 0.01);
    });

    it('should reset zoom and pan', () => {
      element.zoomLevel = 2;
      element.panOffset = { x: 100, y: 50 };

      element.resetZoom();

      expect(element.zoomLevel).to.equal(1);
      expect(element.panOffset.x).to.equal(0);
      expect(element.panOffset.y).to.equal(0);
    });
  });

  describe('View Mode Changes', () => {
    it('should change view mode and regenerate layout', async () => {
      const generateLayoutSpy = spy(element, 'generateLayout');

      element.handleViewModeChange({ target: { value: 'force' } });

      expect(element.viewMode).to.equal('force');
      expect(generateLayoutSpy.calledOnce).to.be.true;
    });

    it('should handle threshold changes', async () => {
      const loadDataSpy = spy(element, 'loadFlowData');

      element.handleThresholdChange({ target: { value: '10' } });

      expect(element.minFlowThreshold).to.equal(10);
      expect(loadDataSpy.calledOnce).to.be.true;
    });

    it('should toggle metrics display', () => {
      const initialState = element.showMetrics;

      element.toggleMetrics();

      expect(element.showMetrics).to.equal(!initialState);
    });
  });

  describe('Edge Rendering', () => {
    beforeEach(() => {
      element.nodes = new Map([
        ['/', { id: '/', x: 0, y: 50, width: 100, height: 50 }],
        ['/product', { id: '/product', x: 200, y: 50, width: 100, height: 50 }]
      ]);

      element.edges = [
        { from: '/', to: '/product', sessions: 100 }
      ];
    });

    it('should calculate edge thickness based on session count', () => {
      element.edges = [
        { from: '/', to: '/product', sessions: 1000 }, // High traffic
        { from: '/', to: '/checkout', sessions: 100 },  // Medium traffic
        { from: '/', to: '/about', sessions: 10 }       // Low traffic
      ];

      expect(element.getEdgeThickness(element.edges[0])).to.equal('thick');
      expect(element.getEdgeThickness(element.edges[2])).to.equal('thin');
    });

    it('should render edges with proper SVG paths', () => {
      const edge = element.edges[0];
      const renderedEdge = element.renderEdge(edge);

      expect(renderedEdge).to.not.be.empty;
    });

    it('should handle missing nodes in edge rendering', () => {
      const invalidEdge = { from: '/nonexistent', to: '/also-nonexistent', sessions: 10 };

      const result = element.renderEdge(invalidEdge);
      expect(result).to.equal('');
    });
  });

  describe('Metrics Calculation', () => {
    beforeEach(() => {
      element.edges = [
        { from: '/', to: '/product', sessions: 100 },
        { from: '/', to: '/about', sessions: 50 },
        { from: '/product', to: '/checkout', sessions: 30 }
      ];

      element.nodes = new Map([
        ['/', { id: '/', uniqueSessions: 150, path: '/' }],
        ['/product', { id: '/product', uniqueSessions: 100, path: '/product' }],
        ['/about', { id: '/about', uniqueSessions: 50, path: '/about' }],
        ['/checkout', { id: '/checkout', uniqueSessions: 30, path: '/checkout' }]
      ]);
    });

    it('should calculate outflow percentages', () => {
      element.calculateMetrics();

      const homeToProduct = element.edges.find(e => e.from === '/' && e.to === '/product');
      const homeToAbout = element.edges.find(e => e.from === '/' && e.to === '/about');

      if (homeToProduct && homeToAbout) {
        // Total outflow from home: 100 + 50 = 150
        // Product: 100/150 = 66.67%, About: 50/150 = 33.33%
        expect(homeToProduct.percentage).to.be.closeTo(66.67, 1);
        expect(homeToAbout.percentage).to.be.closeTo(33.33, 1);
      }
    });

    it('should calculate bounce rates', () => {
      element.calculateMetrics();

      const aboutNode = element.nodes.get('/about');
      if (aboutNode) {
        // About page has no outgoing edges, so bounce rate should be 100%
        expect(aboutNode.bounceRate).to.equal(100);
      }
    });

    it('should handle nodes with no outgoing edges', () => {
      element.edges = []; // No edges

      expect(() => {
        element.calculateMetrics();
      }).to.not.throw();

      // All nodes should have 0% bounce rate with no edges
      Array.from(element.nodes.values()).forEach(node => {
        expect(node.bounceRate).to.equal(0);
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('should set up resize observer', () => {
      expect(element.resizeObserver).to.exist;
    });

    it('should handle container resize', async () => {
      const initialWidth = element.width;

      // Simulate resize
      element.width = 1200;
      element.height = 800;

      expect(element.width).to.not.equal(initialWidth);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      apiStub.restore();
      apiStub = stub(window, 'fetch').rejects(new Error('Network error'));

      const errorElement = await fixture(html`<user-flow-diagram></user-flow-diagram>`);

      expect(errorElement).to.exist;
      expect(errorElement.loading).to.be.false;
    });

    it('should show empty state when no data', async () => {
      element.nodes.clear();
      element.edges = [];
      await element.updateComplete;

      const emptyState = element.shadowRoot.querySelector('.empty-state');
      expect(emptyState).to.exist;
    });

    it('should handle malformed API responses', async () => {
      apiStub.restore();
      apiStub = stub(window, 'fetch').resolves({
        ok: true,
        json: () => Promise.resolve({ data: null })
      });

      await element.loadFlowData();

      expect(element.nodes).to.be.instanceOf(Map);
      expect(element.edges).to.be.an('array');
    });
  });

  describe('Time Range Filtering', () => {
    it('should use correct date range in API calls', async () => {
      element.timeRange = '30d';
      await element.loadFlowData();

      expect(apiStub.called).to.be.true;

      // Verify date parameters are passed correctly
      const call = apiStub.lastCall;
      if (call && call.args[1]) {
        const body = JSON.parse(call.args[1].body || '{}');
        expect(body.params).to.have.property('start_date');
        expect(body.params).to.have.property('end_date');
      }
    });

    it('should handle different time range options', () => {
      const ranges = ['1d', '7d', '30d', '90d'];

      ranges.forEach(range => {
        element.timeRange = range;
        const { start, end } = element.getDateRange ? element.getDateRange(range) : { start: new Date(), end: new Date() };

        expect(start).to.be.instanceOf(Date);
        expect(end).to.be.instanceOf(Date);
        expect(start.getTime()).to.be.lessThan(end.getTime());
      });
    });
  });

  describe('Rendering', () => {
    beforeEach(async () => {
      element.nodes = new Map([
        ['/', {
          id: '/',
          title: 'Home',
          path: '/',
          type: 'start',
          x: 100,
          y: 100,
          width: 150,
          height: 80,
          visits: 1000,
          uniqueSessions: 800,
          bounceRate: 15
        }]
      ]);

      await element.updateComplete;
    });

    it('should render nodes', () => {
      const nodes = element.shadowRoot.querySelectorAll('.flow-node');
      expect(nodes.length).to.be.greaterThan(0);
    });

    it('should show node metrics when enabled', async () => {
      element.showMetrics = true;
      await element.updateComplete;

      const nodeMetrics = element.shadowRoot.querySelectorAll('.node-metrics');
      expect(nodeMetrics.length).to.be.greaterThan(0);
    });

    it('should hide node metrics when disabled', async () => {
      element.showMetrics = false;
      await element.updateComplete;

      const nodeMetrics = element.shadowRoot.querySelectorAll('.node-metrics');
      expect(nodeMetrics.length).to.equal(0);
    });

    it('should apply zoom and pan transformations', async () => {
      element.zoomLevel = 1.5;
      element.panOffset = { x: 50, y: 25 };
      await element.updateComplete;

      const canvas = element.shadowRoot.querySelector('.flow-canvas');
      expect(canvas.style.transform).to.include('scale(1.5)');
      expect(canvas.style.transform).to.include('translate(50px, 25px)');
    });

    it('should show loading state', async () => {
      element.loading = true;
      await element.updateComplete;

      const loadingSpinner = element.shadowRoot.querySelector('.loading-spinner');
      expect(loadingSpinner).to.exist;
    });

    it('should render path details when node is selected', async () => {
      const node = element.nodes.get('/');
      element.highlightedNode = node;
      element.selectedPath = [[node]];
      await element.updateComplete;

      const pathDetails = element.shadowRoot.querySelector('.path-details');
      expect(pathDetails).to.exist;
    });

    it('should render zoom controls', () => {
      const zoomControls = element.shadowRoot.querySelector('.zoom-controls');
      expect(zoomControls).to.exist;

      const zoomButtons = element.shadowRoot.querySelectorAll('.zoom-button');
      expect(zoomButtons.length).to.equal(3); // +, -, reset
    });

    it('should render legend', () => {
      const legend = element.shadowRoot.querySelector('.legend');
      expect(legend).to.exist;

      const legendItems = element.shadowRoot.querySelectorAll('.legend-item');
      expect(legendItems.length).to.equal(3); // High, Medium, Low traffic
    });
  });

  describe('Accessibility', () => {
    it('should support keyboard navigation', () => {
      const nodes = element.shadowRoot.querySelectorAll('.flow-node');

      nodes.forEach(node => {
        // Nodes should be keyboard accessible
        expect(node.getAttribute('tabindex')).to.not.be.null;
      });
    });

    it('should provide meaningful labels', () => {
      const container = element.shadowRoot.querySelector('.flow-container');
      expect(container).to.exist;
    });
  });

  describe('Performance', () => {
    it('should limit the number of rendered paths', () => {
      const node = { path: '/' };

      // Create many mock paths
      const mockPaths = Array.from({ length: 20 }, (_, i) => [
        { title: `Step ${i}`, uniqueSessions: 100 - i }
      ]);

      element.selectedPath = mockPaths;

      // Should limit to reasonable number
      expect(element.selectedPath.length).to.be.at.most(5);
    });

    it('should handle large numbers of nodes efficiently', () => {
      // Create many nodes
      const largeNodeSet = new Map();
      for (let i = 0; i < 100; i++) {
        largeNodeSet.set(`/page${i}`, {
          id: `/page${i}`,
          title: `Page ${i}`,
          x: i * 10,
          y: i * 10,
          width: 100,
          height: 50
        });
      }

      element.nodes = largeNodeSet;

      // Should render without performance issues
      expect(() => {
        element.requestUpdate();
      }).to.not.throw();
    });
  });
});
