"""AI-powered content analysis service with OpenAI/Claude integration."""
import asyncio
import json
import logging
import time
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urlparse

import aiohttp
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.crud import content_suggestion as crud_content
from app.models.content_suggestion import ContentItem, ContentType, ContentCategory
from app.schemas.content_suggestion import ContentItemCreate

logger = logging.getLogger(__name__)


class AIContentAnalyzer:
    """AI-powered content analysis and suggestion engine."""
    
    def __init__(self):
        settings = get_settings()
        self.openai_api_key = getattr(settings, 'OPENAI_API_KEY', None)
        self.anthropic_api_key = getattr(settings, 'ANTHROPIC_API_KEY', None)
        self.model_version = "v1.0.0"
        self.max_tokens = 4000
        self.request_timeout = 30
        
    async def analyze_content_item(
        self,
        db: AsyncSession,
        content_item: ContentItem,
        analysis_types: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """Perform comprehensive AI analysis on a content item."""
        start_time = time.time()
        
        try:
            # Prepare content for analysis
            content_text = self._prepare_content_text(content_item)
            
            # Determine analysis types
            if not analysis_types:
                analysis_types = ["quality", "topics", "sentiment", "optimization", "engagement"]
            
            # Perform AI analysis
            analysis_results = {}
            
            if "quality" in analysis_types:
                analysis_results["quality"] = await self._analyze_quality(content_text, content_item)
            
            if "topics" in analysis_types:
                analysis_results["topics"] = await self._extract_topics(content_text)
            
            if "sentiment" in analysis_types:
                analysis_results["sentiment"] = await self._analyze_sentiment(content_text)
            
            if "optimization" in analysis_types:
                analysis_results["optimization"] = await self._generate_optimization_suggestions(
                    content_text, content_item
                )
            
            if "engagement" in analysis_types:
                analysis_results["engagement"] = await self._predict_engagement(content_text, content_item)
            
            # Calculate scores
            quality_score = analysis_results.get("quality", {}).get("score", 0.5)
            sentiment_score = analysis_results.get("sentiment", {}).get("score", 0.0)
            engagement_prediction = analysis_results.get("engagement", {}).get("prediction", 0.5)
            
            # Update content item with analysis results
            await crud_content.content_item.update_ai_analysis(
                db,
                content_id=content_item.content_id,
                quality_score=quality_score,
                sentiment_score=sentiment_score,
                topics=analysis_results.get("topics", {}),
                ai_analysis=analysis_results,
                optimization_suggestions=analysis_results.get("optimization", {}),
            )
            
            processing_time = time.time() - start_time
            
            logger.info(
                f"Analyzed content {content_item.content_id} in {processing_time:.2f}s - "
                f"Quality: {quality_score:.2f}, Sentiment: {sentiment_score:.2f}"
            )
            
            return {
                "success": True,
                "content_id": content_item.content_id,
                "analysis_results": analysis_results,
                "processing_time_seconds": processing_time,
                "model_version": self.model_version,
            }
            
        except Exception as e:
            logger.error(f"Error analyzing content {content_item.content_id}: {str(e)}")
            return {
                "success": False,
                "content_id": content_item.content_id,
                "error": str(e),
                "processing_time_seconds": time.time() - start_time,
            }

    async def generate_content_suggestions(
        self,
        db: AsyncSession,
        user_id: int,
        user_preferences: Dict[str, Any],
        available_content: List[ContentItem],
        max_suggestions: int = 5,
    ) -> List[Dict[str, Any]]:
        """Generate AI-powered content suggestions for a user."""
        try:
            # Prepare user context
            user_context = self._prepare_user_context(user_preferences)
            
            # Score and rank content
            scored_content = []
            for content_item in available_content:
                relevance_score = await self._calculate_content_relevance(
                    content_item, user_context
                )
                
                confidence_score = await self._calculate_suggestion_confidence(
                    content_item, user_context, relevance_score
                )
                
                priority_score = self._calculate_priority_score(
                    content_item, relevance_score, confidence_score
                )
                
                personalization_score = self._calculate_personalization_score(
                    content_item, user_preferences
                )
                
                scored_content.append({
                    "content_item": content_item,
                    "relevance_score": relevance_score,
                    "confidence_score": confidence_score,
                    "priority_score": priority_score,
                    "personalization_score": personalization_score,
                })
            
            # Sort by priority and take top suggestions
            scored_content.sort(key=lambda x: x["priority_score"], reverse=True)
            top_content = scored_content[:max_suggestions]
            
            # Generate suggestion details with AI
            suggestions = []
            for item_data in top_content:
                suggestion_details = await self._generate_suggestion_details(
                    item_data["content_item"], user_context, item_data
                )
                suggestions.append({
                    **item_data,
                    **suggestion_details,
                })
            
            return suggestions
            
        except Exception as e:
            logger.error(f"Error generating suggestions for user {user_id}: {str(e)}")
            return []

    async def optimize_content_for_engagement(
        self,
        content_item: ContentItem,
        target_audience: Optional[str] = None,
        business_goals: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """Generate optimization suggestions for content."""
        try:
            content_text = self._prepare_content_text(content_item)
            
            # Prepare optimization context
            optimization_context = {
                "content_type": content_item.content_type,
                "category": content_item.category,
                "target_audience": target_audience or "general",
                "business_goals": business_goals or ["engagement", "conversion"],
                "current_metrics": {
                    "view_count": content_item.view_count,
                    "click_count": content_item.click_count,
                    "engagement_rate": content_item.engagement_rate,
                }
            }
            
            # Use AI to generate optimization suggestions
            optimization_results = await self._call_ai_for_optimization(
                content_text, optimization_context
            )
            
            return {
                "content_id": content_item.content_id,
                "optimization_suggestions": optimization_results,
                "improvement_score": optimization_results.get("improvement_potential", 0.5),
                "implementation_complexity": optimization_results.get("complexity", "medium"),
                "estimated_impact": optimization_results.get("estimated_impact", {}),
            }
            
        except Exception as e:
            logger.error(f"Error optimizing content {content_item.content_id}: {str(e)}")
            return {
                "content_id": content_item.content_id,
                "error": str(e),
                "optimization_suggestions": {},
            }

    async def analyze_trending_patterns(
        self,
        db: AsyncSession,
        content_items: List[ContentItem],
        time_window_hours: int = 24,
    ) -> Dict[str, Any]:
        """Analyze trending patterns in content engagement."""
        try:
            # Group content by category and type
            category_performance = {}
            type_performance = {}
            
            for item in content_items:
                # Category analysis
                if item.category not in category_performance:
                    category_performance[item.category] = {
                        "count": 0,
                        "total_engagement": 0,
                        "avg_quality": 0,
                        "items": []
                    }
                
                category_data = category_performance[item.category]
                category_data["count"] += 1
                category_data["total_engagement"] += item.engagement_rate
                category_data["avg_quality"] += item.quality_score or 0
                category_data["items"].append(item)
                
                # Type analysis
                if item.content_type not in type_performance:
                    type_performance[item.content_type] = {
                        "count": 0,
                        "total_engagement": 0,
                        "avg_quality": 0,
                        "items": []
                    }
                
                type_data = type_performance[item.content_type]
                type_data["count"] += 1
                type_data["total_engagement"] += item.engagement_rate
                type_data["avg_quality"] += item.quality_score or 0
                type_data["items"].append(item)
            
            # Calculate averages and trends
            for category, data in category_performance.items():
                if data["count"] > 0:
                    data["avg_engagement"] = data["total_engagement"] / data["count"]
                    data["avg_quality"] = data["avg_quality"] / data["count"]
            
            for content_type, data in type_performance.items():
                if data["count"] > 0:
                    data["avg_engagement"] = data["total_engagement"] / data["count"]
                    data["avg_quality"] = data["avg_quality"] / data["count"]
            
            # Use AI to identify trends and insights
            trend_analysis = await self._analyze_trends_with_ai(
                category_performance, type_performance
            )
            
            return {
                "time_window_hours": time_window_hours,
                "total_content_analyzed": len(content_items),
                "category_performance": category_performance,
                "type_performance": type_performance,
                "ai_insights": trend_analysis,
                "recommendations": trend_analysis.get("recommendations", []),
            }
            
        except Exception as e:
            logger.error(f"Error analyzing trending patterns: {str(e)}")
            return {"error": str(e)}

    # Private helper methods
    
    def _prepare_content_text(self, content_item: ContentItem) -> str:
        """Prepare content text for AI analysis."""
        parts = []
        
        if content_item.title:
            parts.append(f"Title: {content_item.title}")
        
        if content_item.description:
            parts.append(f"Description: {content_item.description}")
        
        if content_item.author:
            parts.append(f"Author: {content_item.author}")
        
        if content_item.source:
            parts.append(f"Source: {content_item.source}")
        
        parts.append(f"Type: {content_item.content_type}")
        parts.append(f"Category: {content_item.category}")
        
        return "\n".join(parts)

    def _prepare_user_context(self, user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Prepare user context for AI analysis."""
        return {
            "interests": user_preferences.get("feature_interests", {}),
            "content_preferences": user_preferences.get("content_preferences", {}),
            "behavioral_patterns": user_preferences.get("behavioral_patterns", {}),
            "engagement_history": user_preferences.get("engagement_history", {}),
        }

    async def _analyze_quality(self, content_text: str, content_item: ContentItem) -> Dict[str, Any]:
        """Analyze content quality using AI."""
        try:
            prompt = f"""
            Analyze the quality of this {content_item.content_type} content:
            
            {content_text}
            
            Provide a quality assessment with:
            1. Overall quality score (0.0-1.0)
            2. Strengths (list)
            3. Weaknesses (list)
            4. Specific improvement suggestions
            5. Readability assessment
            6. Completeness assessment
            
            Return as JSON format.
            """
            
            result = await self._call_ai_api(prompt, "quality_analysis")
            
            return {
                "score": result.get("quality_score", 0.5),
                "strengths": result.get("strengths", []),
                "weaknesses": result.get("weaknesses", []),
                "improvements": result.get("improvements", []),
                "readability": result.get("readability", "medium"),
                "completeness": result.get("completeness", "partial"),
            }
            
        except Exception as e:
            logger.error(f"Error in quality analysis: {str(e)}")
            return {"score": 0.5, "error": str(e)}

    async def _extract_topics(self, content_text: str) -> Dict[str, Any]:
        """Extract topics and keywords using AI."""
        try:
            prompt = f"""
            Extract topics, keywords, and themes from this content:
            
            {content_text}
            
            Provide:
            1. Main topics (with confidence scores)
            2. Keywords (with relevance scores)
            3. Themes and concepts
            4. Subject matter classification
            5. Difficulty level
            
            Return as JSON format.
            """
            
            result = await self._call_ai_api(prompt, "topic_extraction")
            
            return {
                "main_topics": result.get("main_topics", []),
                "keywords": result.get("keywords", []),
                "themes": result.get("themes", []),
                "classification": result.get("classification", "general"),
                "difficulty_level": result.get("difficulty_level", "intermediate"),
            }
            
        except Exception as e:
            logger.error(f"Error in topic extraction: {str(e)}")
            return {"main_topics": [], "keywords": []}

    async def _analyze_sentiment(self, content_text: str) -> Dict[str, Any]:
        """Analyze content sentiment using AI."""
        try:
            prompt = f"""
            Analyze the sentiment and tone of this content:
            
            {content_text}
            
            Provide:
            1. Overall sentiment score (-1.0 to 1.0)
            2. Emotional tone
            3. Confidence level
            4. Key emotional indicators
            
            Return as JSON format.
            """
            
            result = await self._call_ai_api(prompt, "sentiment_analysis")
            
            return {
                "score": result.get("sentiment_score", 0.0),
                "tone": result.get("emotional_tone", "neutral"),
                "confidence": result.get("confidence", 0.5),
                "indicators": result.get("emotional_indicators", []),
            }
            
        except Exception as e:
            logger.error(f"Error in sentiment analysis: {str(e)}")
            return {"score": 0.0, "tone": "neutral"}

    async def _generate_optimization_suggestions(
        self, content_text: str, content_item: ContentItem
    ) -> Dict[str, Any]:
        """Generate optimization suggestions using AI."""
        try:
            prompt = f"""
            Generate optimization suggestions for this {content_item.content_type} content 
            in the {content_item.category} category:
            
            {content_text}
            
            Current metrics:
            - Views: {content_item.view_count}
            - Clicks: {content_item.click_count}
            - Engagement rate: {content_item.engagement_rate}
            
            Provide optimization suggestions for:
            1. SEO improvements
            2. Engagement enhancement
            3. Content structure
            4. Call-to-action optimization
            5. Audience targeting
            
            Return as JSON format with specific, actionable recommendations.
            """
            
            result = await self._call_ai_api(prompt, "optimization")
            
            return {
                "seo_improvements": result.get("seo_improvements", []),
                "engagement_enhancements": result.get("engagement_enhancements", []),
                "structure_improvements": result.get("structure_improvements", []),
                "cta_optimization": result.get("cta_optimization", []),
                "targeting_suggestions": result.get("targeting_suggestions", []),
                "improvement_potential": result.get("improvement_potential", 0.5),
                "complexity": result.get("implementation_complexity", "medium"),
            }
            
        except Exception as e:
            logger.error(f"Error generating optimization suggestions: {str(e)}")
            return {"improvement_potential": 0.5}

    async def _predict_engagement(self, content_text: str, content_item: ContentItem) -> Dict[str, Any]:
        """Predict content engagement using AI."""
        try:
            prompt = f"""
            Predict the engagement potential of this {content_item.content_type} content:
            
            {content_text}
            
            Consider:
            1. Content quality and appeal
            2. Target audience fit
            3. Trending topic relevance
            4. Sharing potential
            5. Conversion likelihood
            
            Provide:
            1. Engagement prediction score (0.0-1.0)
            2. Factors contributing to engagement
            3. Potential reach estimate
            4. Virality potential
            
            Return as JSON format.
            """
            
            result = await self._call_ai_api(prompt, "engagement_prediction")
            
            return {
                "prediction": result.get("engagement_score", 0.5),
                "contributing_factors": result.get("contributing_factors", []),
                "reach_estimate": result.get("reach_estimate", "medium"),
                "virality_potential": result.get("virality_potential", "low"),
            }
            
        except Exception as e:
            logger.error(f"Error predicting engagement: {str(e)}")
            return {"prediction": 0.5}

    async def _calculate_content_relevance(
        self, content_item: ContentItem, user_context: Dict[str, Any]
    ) -> float:
        """Calculate content relevance for a user."""
        try:
            # Base relevance from content quality
            base_score = content_item.quality_score or 0.5
            
            # Category preference boost
            content_prefs = user_context.get("content_preferences", {})
            category_pref = content_prefs.get("categories", {}).get(content_item.category, 0.5)
            
            # Type preference boost
            type_pref = content_prefs.get("types", {}).get(content_item.content_type, 0.5)
            
            # Topic relevance (if available)
            topic_relevance = 0.5
            if content_item.topics and user_context.get("interests"):
                # Calculate topic overlap (simplified)
                user_interests = user_context["interests"]
                content_topics = content_item.topics.get("main_topics", [])
                
                if content_topics and user_interests:
                    # Simple overlap calculation
                    overlap_score = len(set(content_topics) & set(user_interests.keys())) / max(len(content_topics), 1)
                    topic_relevance = min(overlap_score, 1.0)
            
            # Weighted combination
            relevance_score = (
                base_score * 0.3 +
                category_pref * 0.25 +
                type_pref * 0.2 +
                topic_relevance * 0.25
            )
            
            return min(max(relevance_score, 0.0), 1.0)
            
        except Exception as e:
            logger.error(f"Error calculating content relevance: {str(e)}")
            return 0.5

    async def _calculate_suggestion_confidence(
        self, content_item: ContentItem, user_context: Dict[str, Any], relevance_score: float
    ) -> float:
        """Calculate AI confidence in the suggestion."""
        try:
            # Factors that increase confidence
            confidence_factors = []
            
            # High quality content
            if content_item.quality_score and content_item.quality_score > 0.7:
                confidence_factors.append(0.2)
            
            # Good engagement history
            if content_item.engagement_rate > 0.1:
                confidence_factors.append(0.15)
            
            # Strong relevance
            if relevance_score > 0.7:
                confidence_factors.append(0.25)
            
            # Recent content
            if content_item.created_at and (datetime.utcnow() - content_item.created_at).days < 30:
                confidence_factors.append(0.1)
            
            # AI analysis available
            if content_item.ai_analysis:
                confidence_factors.append(0.1)
            
            # Base confidence + factors
            base_confidence = 0.5
            total_confidence = base_confidence + sum(confidence_factors)
            
            return min(max(total_confidence, 0.0), 1.0)
            
        except Exception as e:
            logger.error(f"Error calculating suggestion confidence: {str(e)}")
            return 0.5

    def _calculate_priority_score(
        self, content_item: ContentItem, relevance_score: float, confidence_score: float
    ) -> float:
        """Calculate priority score for ranking suggestions."""
        # Weighted combination of factors
        priority_score = (
            relevance_score * 0.4 +
            confidence_score * 0.3 +
            (content_item.quality_score or 0.5) * 0.2 +
            min(content_item.engagement_rate * 10, 1.0) * 0.1  # Scale engagement rate
        )
        
        return min(max(priority_score, 0.0), 1.0)

    def _calculate_personalization_score(
        self, content_item: ContentItem, user_preferences: Dict[str, Any]
    ) -> float:
        """Calculate how personalized this suggestion is."""
        try:
            personalization_factors = []
            
            # Category match
            content_prefs = user_preferences.get("content_preferences", {})
            if content_item.category in content_prefs.get("preferred_categories", []):
                personalization_factors.append(0.3)
            
            # Type match
            if content_item.content_type in content_prefs.get("preferred_types", []):
                personalization_factors.append(0.2)
            
            # Interest alignment
            interests = user_preferences.get("feature_interests", {})
            if content_item.topics:
                topic_overlap = len(set(content_item.topics.get("main_topics", [])) & set(interests.keys()))
                if topic_overlap > 0:
                    personalization_factors.append(min(topic_overlap * 0.1, 0.3))
            
            # Behavioral pattern match
            behavioral = user_preferences.get("behavioral_patterns", {})
            if behavioral.get("preferred_content_length") == "short" and content_item.content_type in ["tutorial", "article"]:
                personalization_factors.append(0.1)
            
            total_personalization = sum(personalization_factors)
            return min(max(total_personalization, 0.1), 1.0)  # Minimum 0.1 to indicate some personalization
            
        except Exception as e:
            logger.error(f"Error calculating personalization score: {str(e)}")
            return 0.5

    async def _generate_suggestion_details(
        self, content_item: ContentItem, user_context: Dict[str, Any], scores: Dict[str, float]
    ) -> Dict[str, Any]:
        """Generate AI-powered suggestion details."""
        try:
            # Generate personalized title and description
            content_text = self._prepare_content_text(content_item)
            
            prompt = f"""
            Create a personalized content suggestion for this content:
            
            {content_text}
            
            User interests: {user_context.get('interests', {})}
            Content preferences: {user_context.get('content_preferences', {})}
            
            Generate:
            1. Catchy, personalized suggestion title (max 100 chars)
            2. Compelling description explaining why this is relevant (max 200 chars)
            3. Strong call-to-action text (max 30 chars)
            4. Brief reasoning for the suggestion
            
            Return as JSON format.
            """
            
            result = await self._call_ai_api(prompt, "suggestion_generation")
            
            return {
                "title": result.get("title", content_item.title),
                "description": result.get("description", content_item.description or ""),
                "call_to_action": result.get("call_to_action", "Read More"),
                "ai_reasoning": {
                    "explanation": result.get("reasoning", ""),
                    "personalization_factors": result.get("personalization_factors", []),
                    "confidence_factors": result.get("confidence_factors", []),
                },
            }
            
        except Exception as e:
            logger.error(f"Error generating suggestion details: {str(e)}")
            return {
                "title": content_item.title,
                "description": content_item.description or "",
                "call_to_action": "Read More",
                "ai_reasoning": {"explanation": "AI generation failed", "error": str(e)},
            }

    async def _call_ai_for_optimization(
        self, content_text: str, optimization_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Call AI API for content optimization."""
        try:
            prompt = f"""
            Optimize this {optimization_context['content_type']} content for better engagement:
            
            {content_text}
            
            Target audience: {optimization_context['target_audience']}
            Business goals: {optimization_context['business_goals']}
            Current metrics: {optimization_context['current_metrics']}
            
            Provide detailed optimization recommendations including:
            1. Content structure improvements
            2. SEO enhancements
            3. Engagement tactics
            4. Call-to-action optimization
            5. Targeting refinements
            
            Return as JSON with specific, actionable recommendations and estimated impact.
            """
            
            return await self._call_ai_api(prompt, "content_optimization")
            
        except Exception as e:
            logger.error(f"Error in AI optimization call: {str(e)}")
            return {"error": str(e)}

    async def _analyze_trends_with_ai(
        self, category_performance: Dict, type_performance: Dict
    ) -> Dict[str, Any]:
        """Use AI to analyze trends and generate insights."""
        try:
            prompt = f"""
            Analyze these content performance trends and provide insights:
            
            Category Performance:
            {json.dumps(category_performance, indent=2, default=str)}
            
            Content Type Performance:
            {json.dumps(type_performance, indent=2, default=str)}
            
            Provide:
            1. Key trends and patterns
            2. Top performing categories/types
            3. Emerging opportunities
            4. Content strategy recommendations
            5. Audience preference insights
            
            Return as JSON format.
            """
            
            return await self._call_ai_api(prompt, "trend_analysis")
            
        except Exception as e:
            logger.error(f"Error in AI trend analysis: {str(e)}")
            return {"recommendations": [], "trends": []}

    async def _call_ai_api(self, prompt: str, analysis_type: str) -> Dict[str, Any]:
        """Make API call to AI service (OpenAI or Anthropic)."""
        try:
            # Try OpenAI first, then Anthropic as fallback
            if self.openai_api_key:
                return await self._call_openai(prompt, analysis_type)
            elif self.anthropic_api_key:
                return await self._call_anthropic(prompt, analysis_type)
            else:
                # Fallback to mock responses for development
                return self._get_mock_ai_response(analysis_type)
                
        except Exception as e:
            logger.error(f"Error in AI API call: {str(e)}")
            return self._get_mock_ai_response(analysis_type)

    async def _call_openai(self, prompt: str, analysis_type: str) -> Dict[str, Any]:
        """Call OpenAI API."""
        headers = {
            "Authorization": f"Bearer {self.openai_api_key}",
            "Content-Type": "application/json",
        }
        
        payload = {
            "model": "gpt-4",
            "messages": [
                {
                    "role": "system",
                    "content": f"You are an expert content analyst. Provide detailed {analysis_type} in JSON format."
                },
                {"role": "user", "content": prompt}
            ],
            "max_tokens": self.max_tokens,
            "temperature": 0.7,
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=self.request_timeout)
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    content = result["choices"][0]["message"]["content"]
                    try:
                        return json.loads(content)
                    except json.JSONDecodeError:
                        return {"raw_response": content}
                else:
                    error_text = await response.text()
                    raise Exception(f"OpenAI API error {response.status}: {error_text}")

    async def _call_anthropic(self, prompt: str, analysis_type: str) -> Dict[str, Any]:
        """Call Anthropic Claude API."""
        headers = {
            "x-api-key": self.anthropic_api_key,
            "Content-Type": "application/json",
        }
        
        payload = {
            "model": "claude-3-sonnet-20240229",
            "max_tokens": self.max_tokens,
            "messages": [
                {
                    "role": "user",
                    "content": f"You are an expert content analyst. Provide detailed {analysis_type} in JSON format.\n\n{prompt}"
                }
            ],
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://api.anthropic.com/v1/messages",
                headers=headers,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=self.request_timeout)
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    content = result["content"][0]["text"]
                    try:
                        return json.loads(content)
                    except json.JSONDecodeError:
                        return {"raw_response": content}
                else:
                    error_text = await response.text()
                    raise Exception(f"Anthropic API error {response.status}: {error_text}")

    def _get_mock_ai_response(self, analysis_type: str) -> Dict[str, Any]:
        """Get mock AI response for development/testing."""
        mock_responses = {
            "quality_analysis": {
                "quality_score": 0.75,
                "strengths": ["Clear writing", "Good structure"],
                "weaknesses": ["Could be more engaging"],
                "improvements": ["Add more examples", "Include call-to-action"],
                "readability": "good",
                "completeness": "mostly_complete",
            },
            "topic_extraction": {
                "main_topics": ["technology", "productivity", "automation"],
                "keywords": ["AI", "efficiency", "tools"],
                "themes": ["innovation", "workplace transformation"],
                "classification": "technology",
                "difficulty_level": "intermediate",
            },
            "sentiment_analysis": {
                "sentiment_score": 0.2,
                "emotional_tone": "positive",
                "confidence": 0.8,
                "emotional_indicators": ["exciting", "beneficial", "promising"],
            },
            "optimization": {
                "seo_improvements": ["Add meta description", "Optimize title"],
                "engagement_enhancements": ["Add interactive elements"],
                "structure_improvements": ["Use bullet points"],
                "cta_optimization": ["Make CTA more prominent"],
                "targeting_suggestions": ["Focus on professionals"],
                "improvement_potential": 0.6,
                "implementation_complexity": "medium",
            },
            "engagement_prediction": {
                "engagement_score": 0.65,
                "contributing_factors": ["Trending topic", "High quality"],
                "reach_estimate": "medium",
                "virality_potential": "medium",
            },
            "suggestion_generation": {
                "title": "Discover This Amazing Content Just for You!",
                "description": "Based on your interests in technology and productivity, this content is perfect for you.",
                "call_to_action": "Explore Now",
                "reasoning": "Matches user's technology interests",
                "personalization_factors": ["interest_match", "category_preference"],
                "confidence_factors": ["high_quality", "recent_content"],
            },
            "content_optimization": {
                "structure_improvements": ["Add headings", "Include summary"],
                "seo_enhancements": ["Optimize keywords", "Add alt text"],
                "engagement_tactics": ["Add questions", "Include examples"],
                "cta_optimization": ["Make more specific", "Add urgency"],
                "targeting_refinements": ["Narrow audience", "Add personas"],
                "estimated_impact": {"engagement": 0.3, "conversions": 0.2},
            },
            "trend_analysis": {
                "trends": ["Increasing interest in AI", "Video content popularity"],
                "top_performers": ["technology", "tutorials"],
                "opportunities": ["AI tutorials", "Interactive content"],
                "recommendations": ["Focus on video", "Add AI topics"],
                "audience_insights": ["Prefer short content", "High engagement with tutorials"],
            }
        }
        
        return mock_responses.get(analysis_type, {"mock": True, "type": analysis_type})