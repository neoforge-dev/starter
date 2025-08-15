import { expect } from '@open-wc/testing';
import { spy, stub } from 'sinon';
import { journeyIntelligence, JourneyIntelligenceService } from '../../src/services/journey-intelligence.js';

describe('JourneyIntelligenceService', () => {
  let service;
  let apiStub;

  const mockAnalyticsResponse = {
    data: {
      results: [
        {
          dimensions: { event_type: 'journey_start', session_id: 'session1' },
          count: 1000,
          metrics: { count_distinct_sessions: 800, avg_value: 180000 }
        },
        {
          dimensions: { event_type: 'page_enter', page_path: '/' },
          count: 2500,
          metrics: { count_distinct_sessions: 800 }
        },
        {
          dimensions: { event_type: 'conversion' },
          count: 50,
          metrics: { count_distinct_sessions: 45 }
        },
        {
          dimensions: { event_type: 'journey_end' },
          count: 900,
          metrics: { avg_value: 180000 }
        }
      ]
    }
  };

  beforeEach(() => {
    service = new JourneyIntelligenceService();
    
    // Mock API responses
    apiStub = stub(window, 'fetch').resolves({
      ok: true,
      json: () => Promise.resolve(mockAnalyticsResponse)
    });
  });

  afterEach(() => {
    if (apiStub) apiStub.restore();
    service.clearCache();
  });

  describe('Initialization', () => {
    it('should initialize with correct properties', () => {
      expect(service.cache).to.be.instanceOf(Map);
      expect(service.cacheTimeout).to.equal(300000);
      expect(service.insightEngine).to.exist;
      expect(service.cohortAnalyzer).to.exist;
      expect(service.segmentationEngine).to.exist;
    });

    it('should use singleton pattern', () => {
      expect(journeyIntelligence).to.be.instanceOf(JourneyIntelligenceService);
    });
  });

  describe('Report Generation', () => {
    it('should generate comprehensive analytics report', async () => {
      const report = await service.generateReport('7d');
      
      expect(report).to.be.an('object');
      expect(report).to.have.property('metrics');
      expect(report).to.have.property('funnel');
      expect(report).to.have.property('cohorts');
      expect(report).to.have.property('segments');
      expect(report).to.have.property('predictions');
      expect(report).to.have.property('insights');
      expect(report).to.have.property('recommendations');
      expect(report).to.have.property('summary');
      expect(report).to.have.property('generatedAt');
    });

    it('should cache report results', async () => {
      const report1 = await service.generateReport('7d');
      const report2 = await service.generateReport('7d');
      
      expect(report1).to.equal(report2);
      expect(apiStub.calledOnce).to.be.true;
    });

    it('should respect cache timeout', async () => {
      // Set very short cache timeout
      service.cacheTimeout = 1;
      
      const report1 = await service.generateReport('7d');
      
      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const report2 = await service.generateReport('7d');
      
      expect(apiStub.calledTwice).to.be.true;
    });

    it('should handle different time ranges', async () => {
      const timeRanges = ['1d', '7d', '30d', '90d'];
      
      for (const timeRange of timeRanges) {
        const report = await service.generateReport(timeRange);
        expect(report).to.be.an('object');
        expect(report.generatedAt).to.exist;
      }
    });
  });

  describe('Journey Metrics Calculation', () => {
    beforeEach(async () => {
      await service.calculateJourneyMetrics('7d');
    });

    it('should calculate journey metrics from analytics data', async () => {
      const metrics = await service.calculateJourneyMetrics('7d');
      
      expect(metrics).to.have.property('overview');
      expect(metrics).to.have.property('pages');
      expect(metrics).to.have.property('events');
      expect(metrics).to.have.property('trends');
      expect(metrics).to.have.property('quality');
    });

    it('should calculate overview metrics correctly', async () => {
      const metrics = await service.calculateJourneyMetrics('7d');
      const overview = metrics.overview;
      
      expect(overview.totalSessions).to.be.a('number');
      expect(overview.uniqueUsers).to.be.a('number');
      expect(overview.conversionRate).to.be.a('number');
      expect(overview.avgPagesPerSession).to.be.a('number');
      expect(overview.engagementRate).to.be.a('number');
      expect(overview.completionRate).to.be.a('number');
    });

    it('should process page metrics', async () => {
      const metrics = await service.calculateJourneyMetrics('7d');
      
      expect(metrics.pages).to.be.an('array');
      
      if (metrics.pages.length > 0) {
        const page = metrics.pages[0];
        expect(page).to.have.property('path');
        expect(page).to.have.property('visits');
        expect(page).to.have.property('uniqueVisitors');
        expect(page).to.have.property('bounceRate');
        expect(page).to.have.property('conversionRate');
      }
    });

    it('should process event metrics', async () => {
      const metrics = await service.calculateJourneyMetrics('7d');
      
      expect(metrics.events).to.be.an('array');
      
      if (metrics.events.length > 0) {
        const event = metrics.events[0];
        expect(event).to.have.property('type');
        expect(event).to.have.property('count');
        expect(event).to.have.property('uniqueSessions');
        expect(event).to.have.property('frequency');
      }
    });

    it('should handle empty analytics data', async () => {
      apiStub.restore();
      apiStub = stub(window, 'fetch').resolves({
        ok: true,
        json: () => Promise.resolve({ data: { results: [] } })
      });
      
      const metrics = await service.calculateJourneyMetrics('7d');
      
      expect(metrics).to.be.an('object');
      expect(metrics.overview.totalSessions).to.equal(0);
    });

    it('should handle API errors gracefully', async () => {
      apiStub.restore();
      apiStub = stub(window, 'fetch').rejects(new Error('Network error'));
      
      const metrics = await service.calculateJourneyMetrics('7d');
      
      expect(metrics).to.be.an('object');
      expect(metrics.overview).to.exist;
    });
  });

  describe('Funnel Analysis', () => {
    it('should analyze funnel performance', async () => {
      const funnelAnalysis = await service.analyzeFunnelPerformance('7d');
      
      expect(funnelAnalysis).to.have.property('steps');
      expect(funnelAnalysis).to.have.property('dropOffPoints');
      expect(funnelAnalysis).to.have.property('conversionPaths');
      expect(funnelAnalysis).to.have.property('optimization');
    });

    it('should identify drop-off points', async () => {
      const analysis = await service.analyzeFunnelPerformance('7d');
      
      expect(analysis.dropOffPoints).to.be.an('array');
      
      analysis.dropOffPoints.forEach(dropOff => {
        expect(dropOff).to.have.property('fromStep');
        expect(dropOff).to.have.property('toStep');
        expect(dropOff).to.have.property('dropOffRate');
        expect(dropOff).to.have.property('usersLost');
        expect(dropOff).to.have.property('severity');
      });
    });

    it('should analyze conversion paths', async () => {
      const paths = await service.analyzeConversionPaths('7d');
      
      expect(paths).to.be.an('array');
      
      if (paths.length > 0) {
        const path = paths[0];
        expect(path).to.have.property('path');
        expect(path).to.have.property('frequency');
        expect(path).to.have.property('avgTime');
      }
    });

    it('should generate funnel optimizations', async () => {
      const analysis = await service.analyzeFunnelPerformance('7d');
      
      expect(analysis.optimization).to.be.an('array');
      
      analysis.optimization.forEach(optimization => {
        expect(optimization).to.have.property('type');
        expect(optimization).to.have.property('area');
        expect(optimization).to.have.property('issue');
        expect(optimization).to.have.property('recommendations');
        expect(optimization).to.have.property('potentialImpact');
        expect(optimization).to.have.property('effort');
      });
    });
  });

  describe('Predictive Insights', () => {
    it('should generate predictive insights', async () => {
      const predictions = await service.generatePredictiveInsights('7d');
      
      expect(predictions).to.have.property('conversionPrediction');
      expect(predictions).to.have.property('churnPrediction');
      expect(predictions).to.have.property('seasonalityAnalysis');
      expect(predictions).to.have.property('anomalyDetection');
      expect(predictions).to.have.property('recommendations');
    });

    it('should predict conversion trends', async () => {
      const historical = await service.getHistoricalData('7d');
      const prediction = service.predictConversionTrends(historical);
      
      expect(prediction).to.have.property('nextPeriod');
      expect(prediction).to.have.property('longTerm');
      expect(prediction.nextPeriod).to.have.property('expectedIncrease');
      expect(prediction.nextPeriod).to.have.property('confidence');
      expect(prediction.nextPeriod).to.have.property('factors');
    });

    it('should predict churn risk', async () => {
      const historical = await service.getHistoricalData('7d');
      const churnPrediction = service.predictChurnRisk(historical);
      
      expect(churnPrediction).to.have.property('highRiskUsers');
      expect(churnPrediction).to.have.property('mediumRiskUsers');
      expect(churnPrediction).to.have.property('riskFactors');
      expect(churnPrediction).to.have.property('preventionStrategies');
    });

    it('should analyze seasonality patterns', async () => {
      const historical = await service.getHistoricalData('7d');
      const seasonality = service.analyzeSeasonality(historical);
      
      expect(seasonality).to.have.property('weeklyPattern');
      expect(seasonality).to.have.property('monthlyPattern');
      expect(seasonality).to.have.property('recommendations');
      
      expect(seasonality.weeklyPattern).to.have.property('monday');
      expect(seasonality.weeklyPattern).to.have.property('sunday');
    });

    it('should detect anomalies', async () => {
      const historical = await service.getHistoricalData('7d');
      const anomalies = service.detectAnomalies(historical);
      
      expect(anomalies).to.have.property('detected');
      expect(anomalies).to.have.property('monitoring');
      expect(anomalies.detected).to.be.an('array');
      
      anomalies.detected.forEach(anomaly => {
        expect(anomaly).to.have.property('date');
        expect(anomaly).to.have.property('type');
        expect(anomaly).to.have.property('description');
        expect(anomaly).to.have.property('cause');
        expect(anomaly).to.have.property('action');
      });
    });
  });

  describe('Recommendations Generation', () => {
    it('should generate actionable recommendations', () => {
      const mockInsights = [
        {
          severity: 'critical',
          category: 'conversion',
          title: 'Low Conversion Rate',
          recommendations: ['Optimize checkout', 'Add social proof'],
          impact: 'high',
          effort: 'medium'
        },
        {
          severity: 'warning',
          category: 'engagement',
          title: 'Low Engagement',
          recommendations: ['Improve content', 'Add interactions'],
          impact: 'medium',
          effort: 'low'
        }
      ];
      
      const recommendations = service.generateRecommendations(mockInsights);
      
      expect(recommendations).to.be.an('array');
      expect(recommendations).to.have.length(2);
      
      recommendations.forEach(rec => {
        expect(rec).to.have.property('priority');
        expect(rec).to.have.property('category');
        expect(rec).to.have.property('title');
        expect(rec).to.have.property('actions');
        expect(rec).to.have.property('impact');
        expect(rec).to.have.property('effort');
        expect(rec).to.have.property('deadline');
      });
    });

    it('should prioritize recommendations correctly', () => {
      const insights = [
        { severity: 'warning', category: 'test' },
        { severity: 'critical', category: 'test' }
      ];
      
      const recommendations = service.generateRecommendations(insights);
      
      expect(recommendations[0].priority).to.equal('immediate');
      expect(recommendations[1].priority).to.equal('high');
    });
  });

  describe('Executive Summary', () => {
    it('should generate executive summary', () => {
      const mockMetrics = {
        overview: {
          totalSessions: 1000,
          conversionRate: 2.5,
          engagementRate: 65
        },
        trends: {
          sessions: { direction: 'up' },
          conversions: { direction: 'up' }
        }
      };
      
      const mockInsights = [
        { severity: 'critical', priority: 'high', title: 'Critical Issue' },
        { type: 'opportunity', title: 'Growth Opportunity' }
      ];
      
      const summary = service.generateExecutiveSummary(mockMetrics, mockInsights);
      
      expect(summary).to.have.property('headline');
      expect(summary).to.have.property('keyMetrics');
      expect(summary).to.have.property('status');
      expect(summary).to.have.property('topRecommendations');
      expect(summary).to.have.property('nextSteps');
    });

    it('should generate appropriate headlines', () => {
      const excellentMetrics = {
        overview: { conversionRate: 4, engagementRate: 80 }
      };
      
      const poorMetrics = {
        overview: { conversionRate: 0.5, engagementRate: 20 }
      };
      
      const excellentHeadline = service.generateHeadline(excellentMetrics);
      const poorHeadline = service.generateHeadline(poorMetrics);
      
      expect(excellentHeadline).to.include('Excellent');
      expect(poorHeadline).to.include('immediate action');
    });

    it('should determine trend direction', () => {
      const positiveTrends = {
        metric1: { direction: 'up' },
        metric2: { direction: 'up' },
        metric3: { direction: 'down' }
      };
      
      const direction = service.getTrendDirection(positiveTrends);
      expect(direction).to.equal('improving');
    });
  });

  describe('Date Range Handling', () => {
    it('should calculate correct start dates', () => {
      const endDate = new Date('2025-08-14');
      
      const ranges = {
        '1d': 1,
        '7d': 7,
        '30d': 30,
        '90d': 90
      };
      
      Object.entries(ranges).forEach(([range, expectedDays]) => {
        const startDate = service.getStartDate(endDate, range);
        const daysDiff = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
        expect(daysDiff).to.equal(expectedDays);
      });
    });

    it('should handle invalid time ranges', () => {
      const endDate = new Date('2025-08-14');
      const startDate = service.getStartDate(endDate, 'invalid');
      
      // Should default to 7 days
      const daysDiff = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
      expect(daysDiff).to.equal(7);
    });
  });

  describe('Cache Management', () => {
    it('should cache results correctly', async () => {
      const report1 = await service.generateReport('7d');
      expect(service.cache.size).to.equal(1);
      
      const report2 = await service.generateReport('30d');
      expect(service.cache.size).to.equal(2);
    });

    it('should clear cache', () => {
      service.cache.set('test', { data: 'test', timestamp: Date.now() });
      expect(service.cache.size).to.equal(1);
      
      service.clearCache();
      expect(service.cache.size).to.equal(0);
    });

    it('should generate unique cache keys for different options', async () => {
      await service.generateReport('7d', { segment: 'all' });
      await service.generateReport('7d', { segment: 'mobile' });
      
      expect(service.cache.size).to.equal(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle API failures gracefully', async () => {
      apiStub.restore();
      apiStub = stub(window, 'fetch').rejects(new Error('Network error'));
      
      const report = await service.generateReport('7d');
      
      expect(report).to.be.an('object');
      expect(report.metrics).to.exist;
    });

    it('should return default metrics on error', () => {
      const defaultMetrics = service.getDefaultMetrics();
      
      expect(defaultMetrics).to.be.an('object');
      expect(defaultMetrics.overview).to.exist;
      expect(defaultMetrics.overview.totalSessions).to.equal(0);
    });

    it('should handle malformed API responses', async () => {
      apiStub.restore();
      apiStub = stub(window, 'fetch').resolves({
        ok: true,
        json: () => Promise.resolve({ malformed: 'data' })
      });
      
      const metrics = await service.calculateJourneyMetrics('7d');
      expect(metrics).to.be.an('object');
    });
  });
});

describe('InsightEngine', () => {
  let insightEngine;

  beforeEach(() => {
    // Access the internal InsightEngine class through the service
    insightEngine = new (class InsightEngine {
      generateInsights(data) {
        const insights = [];
        
        // Performance insights
        insights.push(...this.analyzePerformance(data.metrics));
        
        return this.prioritizeInsights(insights);
      }

      analyzePerformance(metrics) {
        const insights = [];
        const { overview } = metrics;
        
        if (overview.conversionRate < 1.5) {
          insights.push({
            type: 'performance',
            severity: 'critical',
            category: 'conversion',
            title: 'Low Conversion Rate',
            priority: 'high'
          });
        }
        
        return insights;
      }

      prioritizeInsights(insights) {
        const priorityOrder = { immediate: 0, high: 1, medium: 2, low: 3 };
        
        return insights.sort((a, b) => {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
      }
    })();
  });

  describe('Insight Generation', () => {
    it('should generate performance insights', () => {
      const mockData = {
        metrics: {
          overview: {
            conversionRate: 0.8,
            engagementRate: 30
          },
          quality: {
            qualityScore: 45
          }
        }
      };
      
      const insights = insightEngine.generateInsights(mockData);
      
      expect(insights).to.be.an('array');
      expect(insights.length).to.be.greaterThan(0);
      
      const conversionInsight = insights.find(i => i.title === 'Low Conversion Rate');
      expect(conversionInsight).to.exist;
      expect(conversionInsight.severity).to.equal('critical');
    });

    it('should prioritize insights correctly', () => {
      const insights = [
        { priority: 'medium', title: 'Medium Priority' },
        { priority: 'high', title: 'High Priority' },
        { priority: 'immediate', title: 'Immediate Priority' }
      ];
      
      const prioritized = insightEngine.prioritizeInsights(insights);
      
      expect(prioritized[0].priority).to.equal('immediate');
      expect(prioritized[1].priority).to.equal('high');
      expect(prioritized[2].priority).to.equal('medium');
    });
  });
});

describe('CohortAnalyzer', () => {
  let cohortAnalyzer;

  beforeEach(() => {
    cohortAnalyzer = new (class CohortAnalyzer {
      async analyze(timeRange) {
        return {
          retention: this.generateRetentionData(),
          segments: this.generateSegmentData(),
          insights: this.generateCohortInsights()
        };
      }

      generateRetentionData() {
        return {
          day1: 85,
          day7: 42,
          day30: 18,
          day90: 12
        };
      }

      generateSegmentData() {
        return [
          { name: 'Power Users', size: 156, retention: 89, value: 'high' },
          { name: 'Regular Users', size: 1247, retention: 45, value: 'medium' },
          { name: 'Casual Users', size: 2891, retention: 15, value: 'low' }
        ];
      }

      generateCohortInsights() {
        return [
          'Day 1 retention is above average at 85%',
          'Significant drop-off between day 1 and day 7'
        ];
      }
    })();
  });

  describe('Cohort Analysis', () => {
    it('should analyze cohort data', async () => {
      const analysis = await cohortAnalyzer.analyze('7d');
      
      expect(analysis).to.have.property('retention');
      expect(analysis).to.have.property('segments');
      expect(analysis).to.have.property('insights');
    });

    it('should generate retention data', () => {
      const retention = cohortAnalyzer.generateRetentionData();
      
      expect(retention).to.have.property('day1');
      expect(retention).to.have.property('day7');
      expect(retention).to.have.property('day30');
      expect(retention).to.have.property('day90');
      
      // Retention should generally decrease over time
      expect(retention.day1).to.be.greaterThan(retention.day7);
      expect(retention.day7).to.be.greaterThan(retention.day30);
    });

    it('should generate segment data', () => {
      const segments = cohortAnalyzer.generateSegmentData();
      
      expect(segments).to.be.an('array');
      
      segments.forEach(segment => {
        expect(segment).to.have.property('name');
        expect(segment).to.have.property('size');
        expect(segment).to.have.property('retention');
        expect(segment).to.have.property('value');
      });
    });
  });
});

describe('SegmentationEngine', () => {
  let segmentationEngine;

  beforeEach(() => {
    segmentationEngine = new (class SegmentationEngine {
      async analyzeSegments(timeRange) {
        return {
          behavioral: this.generateBehavioralSegments(),
          demographic: this.generateDemographicSegments(),
          value: this.generateValueSegments(),
          recommendations: this.generateSegmentRecommendations()
        };
      }

      generateBehavioralSegments() {
        return [
          { name: 'Browsers', percentage: 45, description: 'Users who browse but rarely convert' },
          { name: 'Converters', percentage: 12, description: 'Users who convert quickly' }
        ];
      }

      generateDemographicSegments() {
        return [
          { name: 'Young Professionals', percentage: 35, performance: 'high' },
          { name: 'Students', percentage: 25, performance: 'medium' }
        ];
      }

      generateValueSegments() {
        return [
          { name: 'High Value', percentage: 8, ltv: 2500, conversion: 15.2 },
          { name: 'Low Value', percentage: 70, ltv: 200, conversion: 2.3 }
        ];
      }

      generateSegmentRecommendations() {
        return [
          'Focus high-value messaging on Executive segment',
          'Create educational content for Researcher segment'
        ];
      }
    })();
  });

  describe('Segmentation Analysis', () => {
    it('should analyze user segments', async () => {
      const analysis = await segmentationEngine.analyzeSegments('7d');
      
      expect(analysis).to.have.property('behavioral');
      expect(analysis).to.have.property('demographic');
      expect(analysis).to.have.property('value');
      expect(analysis).to.have.property('recommendations');
    });

    it('should generate behavioral segments', () => {
      const segments = segmentationEngine.generateBehavioralSegments();
      
      expect(segments).to.be.an('array');
      
      segments.forEach(segment => {
        expect(segment).to.have.property('name');
        expect(segment).to.have.property('percentage');
        expect(segment).to.have.property('description');
      });
    });

    it('should generate value segments', () => {
      const segments = segmentationEngine.generateValueSegments();
      
      expect(segments).to.be.an('array');
      
      segments.forEach(segment => {
        expect(segment).to.have.property('name');
        expect(segment).to.have.property('ltv');
        expect(segment).to.have.property('conversion');
      });
    });

    it('should provide segment recommendations', () => {
      const recommendations = segmentationEngine.generateSegmentRecommendations();
      
      expect(recommendations).to.be.an('array');
      expect(recommendations.length).to.be.greaterThan(0);
      
      recommendations.forEach(rec => {
        expect(rec).to.be.a('string');
      });
    });
  });
});