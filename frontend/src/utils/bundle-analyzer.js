/**
 * Bundle Size Analyzer and Optimizer
 * Monitors bundle performance and provides optimization recommendations
 */

// Bundle size thresholds (in bytes)
const BUNDLE_THRESHOLDS = {
  CRITICAL: 50 * 1024,  // 50KB - Critical bundle size
  WARNING: 100 * 1024,  // 100KB - Warning threshold
  ERROR: 200 * 1024,    // 200KB - Error threshold
  CHUNK: 30 * 1024,     // 30KB - Maximum chunk size
};

// Performance tracking
const performanceTracker = {
  loadTimes: new Map(),
  bundleSizes: new Map(),
  chunkLoads: new Map(),
  errors: []
};

/**
 * Monitor bundle loading performance
 */
export function initBundleMonitoring() {
  // Track initial bundle load time
  const navigationStart = performance.timing.navigationStart;
  const loadEventEnd = performance.timing.loadEventEnd;
  const initialLoadTime = loadEventEnd - navigationStart;
  
  performanceTracker.loadTimes.set('initial', initialLoadTime);
  
  // Monitor dynamic imports
  const originalImport = window.import || eval('import');
  if (originalImport) {
    window.import = async function(...args) {
      const startTime = performance.now();
      const modulePath = args[0];
      
      try {
        const result = await originalImport.apply(this, args);
        const loadTime = performance.now() - startTime;
        
        performanceTracker.loadTimes.set(modulePath, loadTime);
        recordChunkLoad(modulePath, loadTime);
        
        return result;
      } catch (error) {
        const loadTime = performance.now() - startTime;
        performanceTracker.errors.push({
          module: modulePath,
          error: error.message,
          loadTime
        });
        throw error;
      }
    };
  }
  
  // Monitor navigation API if available
  if ('navigation' in window) {
    window.navigation.addEventListener('navigate', (event) => {
      const startTime = performance.now();
      event.intercept({
        handler: async () => {
          const endTime = performance.now();
          const routeLoadTime = endTime - startTime;
          performanceTracker.loadTimes.set(`route-${event.destination.url}`, routeLoadTime);
        }
      });
    });
  }
}

/**
 * Record chunk loading statistics
 */
function recordChunkLoad(modulePath, loadTime) {
  const chunkName = extractChunkName(modulePath);
  const existing = performanceTracker.chunkLoads.get(chunkName) || [];
  
  existing.push({
    loadTime,
    timestamp: Date.now(),
    path: modulePath
  });
  
  performanceTracker.chunkLoads.set(chunkName, existing);
}

/**
 * Extract chunk name from module path
 */
function extractChunkName(modulePath) {
  if (modulePath.includes('/atoms/')) return 'components-atoms';
  if (modulePath.includes('/molecules/')) return 'components-molecules';  
  if (modulePath.includes('/organisms/')) return 'components-organisms';
  if (modulePath.includes('/pages/')) return 'pages';
  if (modulePath.includes('/services/')) return 'services';
  if (modulePath.includes('/utils/')) return 'utils';
  if (modulePath.includes('node_modules')) return 'vendor';
  return 'unknown';
}

/**
 * Analyze current bundle performance
 * @returns {Object} Performance analysis
 */
export function analyzeBundlePerformance() {
  const analysis = {
    loadTimes: Object.fromEntries(performanceTracker.loadTimes),
    chunkStats: getChunkStatistics(),
    recommendations: [],
    score: 0,
    errors: performanceTracker.errors
  };
  
  // Calculate performance score
  let score = 100;
  
  // Penalize slow initial load
  const initialLoad = performanceTracker.loadTimes.get('initial') || 0;
  if (initialLoad > 3000) score -= 30;
  else if (initialLoad > 2000) score -= 20;
  else if (initialLoad > 1000) score -= 10;
  
  // Penalize slow chunk loads
  for (const [chunk, loads] of performanceTracker.chunkLoads) {
    const avgLoadTime = loads.reduce((sum, load) => sum + load.loadTime, 0) / loads.length;
    if (avgLoadTime > 500) score -= 10;
    else if (avgLoadTime > 200) score -= 5;
  }
  
  // Generate recommendations
  analysis.recommendations = generateOptimizationRecommendations(analysis);
  analysis.score = Math.max(0, score);
  
  return analysis;
}

/**
 * Get chunk loading statistics
 */
function getChunkStatistics() {
  const stats = {};
  
  for (const [chunkName, loads] of performanceTracker.chunkLoads) {
    const loadTimes = loads.map(load => load.loadTime);
    stats[chunkName] = {
      totalLoads: loads.length,
      averageLoadTime: loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length,
      minLoadTime: Math.min(...loadTimes),
      maxLoadTime: Math.max(...loadTimes),
      lastLoad: loads[loads.length - 1]?.timestamp || 0
    };
  }
  
  return stats;
}

/**
 * Generate optimization recommendations
 */
function generateOptimizationRecommendations(analysis) {
  const recommendations = [];
  
  // Initial load time recommendations
  const initialLoad = analysis.loadTimes.initial || 0;
  if (initialLoad > 2000) {
    recommendations.push({
      type: 'critical',
      category: 'Initial Load',
      message: `Initial load time (${Math.round(initialLoad)}ms) exceeds 2s. Consider code splitting and critical resource optimization.`,
      action: 'Split large bundles and defer non-critical resources'
    });
  }
  
  // Chunk-specific recommendations
  for (const [chunk, stats] of Object.entries(analysis.chunkStats)) {
    if (stats.averageLoadTime > 300) {
      recommendations.push({
        type: 'warning',
        category: 'Chunk Performance',
        message: `${chunk} chunk loads slowly (${Math.round(stats.averageLoadTime)}ms average)`,
        action: 'Consider breaking down large chunks or preloading'
      });
    }
    
    if (stats.totalLoads > 10) {
      recommendations.push({
        type: 'info',
        category: 'Caching',
        message: `${chunk} loaded ${stats.totalLoads} times. Ensure proper caching.`,
        action: 'Implement component-level caching or preloading'
      });
    }
  }
  
  // Error-based recommendations
  if (analysis.errors.length > 0) {
    recommendations.push({
      type: 'critical',
      category: 'Loading Errors',
      message: `${analysis.errors.length} module loading errors detected`,
      action: 'Fix module resolution and dependency issues'
    });
  }
  
  return recommendations;
}

/**
 * Monitor resource sizes using Resource Timing API
 */
export function monitorResourceSizes() {
  if (!window.PerformanceObserver) return;
  
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.initiatorType === 'script' || entry.initiatorType === 'css') {
        const size = entry.transferSize || entry.encodedBodySize || 0;
        performanceTracker.bundleSizes.set(entry.name, {
          size,
          compressed: entry.transferSize,
          uncompressed: entry.decodedBodySize,
          loadTime: entry.duration,
          timestamp: entry.startTime
        });
        
        // Warn about large resources
        if (size > BUNDLE_THRESHOLDS.WARNING) {
          console.warn(`Large resource detected: ${entry.name} (${formatBytes(size)})`);
        }
      }
    }
  });
  
  observer.observe({ entryTypes: ['resource'] });
  return observer;
}

/**
 * Format bytes for human-readable display
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Get bundle size report
 */
export function getBundleSizeReport() {
  const report = {
    totalSize: 0,
    compressedSize: 0,
    resources: [],
    largestResources: [],
    compressionRatio: 0
  };
  
  for (const [url, data] of performanceTracker.bundleSizes) {
    report.totalSize += data.uncompressed || data.size;
    report.compressedSize += data.compressed || data.size;
    
    report.resources.push({
      url: url.split('/').pop(),
      size: formatBytes(data.size),
      compressed: formatBytes(data.compressed || data.size),
      loadTime: Math.round(data.loadTime),
      compressionRatio: data.compressed ? 
        ((1 - data.compressed / data.uncompressed) * 100).toFixed(1) + '%' : 'N/A'
    });
  }
  
  // Sort by size and get largest resources
  report.resources.sort((a, b) => 
    (parseInt(a.size.split(' ')[0]) || 0) - (parseInt(b.size.split(' ')[0]) || 0)
  );
  report.largestResources = report.resources.slice(-5).reverse();
  
  report.compressionRatio = report.compressedSize > 0 ? 
    ((1 - report.compressedSize / report.totalSize) * 100).toFixed(1) + '%' : 'N/A';
    
  return report;
}

/**
 * Export performance data for analysis
 */
export function exportPerformanceData() {
  return {
    timestamp: Date.now(),
    analysis: analyzeBundlePerformance(),
    bundleReport: getBundleSizeReport(),
    rawData: {
      loadTimes: Object.fromEntries(performanceTracker.loadTimes),
      bundleSizes: Object.fromEntries(performanceTracker.bundleSizes),
      chunkLoads: Object.fromEntries(performanceTracker.chunkLoads),
      errors: performanceTracker.errors
    }
  };
}

/**
 * Reset performance tracking data
 */
export function resetPerformanceTracking() {
  performanceTracker.loadTimes.clear();
  performanceTracker.bundleSizes.clear();
  performanceTracker.chunkLoads.clear();
  performanceTracker.errors = [];
}

// Auto-initialize monitoring in development
if (import.meta.env.DEV) {
  initBundleMonitoring();
  monitorResourceSizes();
  
  // Log performance report every 30 seconds in development
  setInterval(() => {
    const analysis = analyzeBundlePerformance();
    if (analysis.score < 80) {
      console.group('Bundle Performance Analysis');
      console.log('Score:', analysis.score);
      console.log('Recommendations:', analysis.recommendations);
      console.groupEnd();
    }
  }, 30000);
}

// Expose to global scope for debugging
if (import.meta.env.DEV) {
  window.bundleAnalyzer = {
    analyze: analyzeBundlePerformance,
    report: getBundleSizeReport,
    export: exportPerformanceData,
    reset: resetPerformanceTracking
  };
}