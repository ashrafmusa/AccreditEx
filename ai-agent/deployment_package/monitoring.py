"""
Performance Monitoring and Metrics for AccreditEx AI Agent
Provides structured logging, metrics collection, and performance tracking
"""
import logging
import time
import structlog
from typing import Dict, Any, Optional
from datetime import datetime
from functools import wraps
import asyncio

class PerformanceMonitor:
    """
    Performance monitoring and metrics collection
    """
    
    def __init__(self):
        self.metrics: Dict[str, Any] = {
            'requests': {
                'total': 0,
                'successful': 0,
                'failed': 0
            },
            'response_times': [],
            'groq_api_calls': 0,
            'firebase_queries': 0,
            'cache_hits': 0,
            'cache_misses': 0,
            'errors': []
        }
        
        # Configure structured logging
        structlog.configure(
            processors=[
                structlog.stdlib.filter_by_level,
                structlog.stdlib.add_logger_name,
                structlog.stdlib.add_log_level,
                structlog.stdlib.PositionalArgumentsFormatter(),
                structlog.processors.TimeStamper(fmt="iso"),
                structlog.processors.StackInfoRenderer(),
                structlog.processors.format_exc_info,
                structlog.processors.UnicodeDecoder(),
                structlog.processors.JSONRenderer()
            ],
            context_class=dict,
            logger_factory=structlog.stdlib.LoggerFactory(),
            cache_logger_on_first_use=True,
        )
        
        self.logger = structlog.get_logger()
    
    def track_request(self, endpoint: str, success: bool = True):
        """Track API request"""
        self.metrics['requests']['total'] += 1
        if success:
            self.metrics['requests']['successful'] += 1
        else:
            self.metrics['requests']['failed'] += 1
        
        self.logger.info(
            "request_tracked",
            endpoint=endpoint,
            success=success,
            total_requests=self.metrics['requests']['total']
        )
    
    def track_response_time(self, endpoint: str, duration: float):
        """Track response time"""
        self.metrics['response_times'].append({
            'endpoint': endpoint,
            'duration': duration,
            'timestamp': datetime.utcnow().isoformat()
        })
        
        # Keep only last 100 response times
        if len(self.metrics['response_times']) > 100:
            self.metrics['response_times'] = self.metrics['response_times'][-100:]
        
        self.logger.info(
            "response_time_tracked",
            endpoint=endpoint,
            duration_ms=round(duration * 1000, 2),
            avg_duration_ms=self.get_avg_response_time()
        )
    
    def track_groq_api_call(self, model: str, tokens_used: Optional[int] = None):
        """Track Groq API call"""
        self.metrics['groq_api_calls'] += 1
        
        self.logger.info(
            "groq_api_call",
            model=model,
            tokens_used=tokens_used,
            total_calls=self.metrics['groq_api_calls']
        )
    
    def track_firebase_query(self, collection: str, query_type: str):
        """Track Firebase query"""
        self.metrics['firebase_queries'] += 1
        
        self.logger.info(
            "firebase_query",
            collection=collection,
            query_type=query_type,
            total_queries=self.metrics['firebase_queries']
        )
    
    def track_cache_hit(self, cache_key: str):
        """Track cache hit"""
        self.metrics['cache_hits'] += 1
        
        self.logger.debug(
            "cache_hit",
            cache_key=cache_key,
            hit_rate=self.get_cache_hit_rate()
        )
    
    def track_cache_miss(self, cache_key: str):
        """Track cache miss"""
        self.metrics['cache_misses'] += 1
        
        self.logger.debug(
            "cache_miss",
            cache_key=cache_key,
            hit_rate=self.get_cache_hit_rate()
        )
    
    def track_error(self, error_type: str, error_message: str, context: Optional[Dict] = None):
        """Track error"""
        error_entry = {
            'type': error_type,
            'message': error_message,
            'timestamp': datetime.utcnow().isoformat(),
            'context': context or {}
        }
        
        self.metrics['errors'].append(error_entry)
        
        # Keep only last 50 errors
        if len(self.metrics['errors']) > 50:
            self.metrics['errors'] = self.metrics['errors'][-50:]
        
        self.logger.error(
            "error_tracked",
            error_type=error_type,
            error_message=error_message,
            context=context
        )
    
    def get_avg_response_time(self) -> float:
        """Get average response time in milliseconds"""
        if not self.metrics['response_times']:
            return 0.0
        
        total = sum(rt['duration'] for rt in self.metrics['response_times'])
        avg = total / len(self.metrics['response_times'])
        return round(avg * 1000, 2)
    
    def get_cache_hit_rate(self) -> float:
        """Get cache hit rate percentage"""
        total = self.metrics['cache_hits'] + self.metrics['cache_misses']
        if total == 0:
            return 0.0
        return round((self.metrics['cache_hits'] / total) * 100, 2)
    
    def get_metrics_summary(self) -> Dict[str, Any]:
        """Get summary of all metrics"""
        return {
            'requests': self.metrics['requests'],
            'avg_response_time_ms': self.get_avg_response_time(),
            'groq_api_calls': self.metrics['groq_api_calls'],
            'firebase_queries': self.metrics['firebase_queries'],
            'cache_stats': {
                'hits': self.metrics['cache_hits'],
                'misses': self.metrics['cache_misses'],
                'hit_rate': self.get_cache_hit_rate()
            },
            'recent_errors_count': len(self.metrics['errors']),
            'last_errors': self.metrics['errors'][-5:] if self.metrics['errors'] else []
        }
    
    def log_info(self, message: str, **kwargs):
        """Structured info logging"""
        self.logger.info(message, **kwargs)
    
    def log_warning(self, message: str, **kwargs):
        """Structured warning logging"""
        self.logger.warning(message, **kwargs)
    
    def log_error(self, message: str, **kwargs):
        """Structured error logging"""
        self.logger.error(message, **kwargs)
    
    def log_debug(self, message: str, **kwargs):
        """Structured debug logging"""
        self.logger.debug(message, **kwargs)


def track_performance(endpoint_name: str):
    """
    Decorator to track endpoint performance
    
    Usage:
        @track_performance("chat")
        async def chat_endpoint():
            ...
    """
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            start_time = time.time()
            monitor = kwargs.get('monitor') or getattr(args[0], 'monitor', None)
            
            try:
                result = await func(*args, **kwargs)
                duration = time.time() - start_time
                
                if monitor:
                    monitor.track_request(endpoint_name, success=True)
                    monitor.track_response_time(endpoint_name, duration)
                
                return result
            except Exception as e:
                duration = time.time() - start_time
                
                if monitor:
                    monitor.track_request(endpoint_name, success=False)
                    monitor.track_response_time(endpoint_name, duration)
                    monitor.track_error(type(e).__name__, str(e), {'endpoint': endpoint_name})
                
                raise
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            start_time = time.time()
            monitor = kwargs.get('monitor') or getattr(args[0], 'monitor', None)
            
            try:
                result = func(*args, **kwargs)
                duration = time.time() - start_time
                
                if monitor:
                    monitor.track_request(endpoint_name, success=True)
                    monitor.track_response_time(endpoint_name, duration)
                
                return result
            except Exception as e:
                duration = time.time() - start_time
                
                if monitor:
                    monitor.track_request(endpoint_name, success=False)
                    monitor.track_response_time(endpoint_name, duration)
                    monitor.track_error(type(e).__name__, str(e), {'endpoint': endpoint_name})
                
                raise
        
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper
    
    return decorator


# Global monitor instance
performance_monitor = PerformanceMonitor()
