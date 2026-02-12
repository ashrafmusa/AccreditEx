"""
Caching layer for Firebase queries to improve performance
"""
from typing import Dict, Any, Optional
import time
import hashlib
import json

class SimpleCache:
    """
    Simple in-memory cache with TTL support
    For production, consider using Redis
    """
    
    def __init__(self, default_ttl: int = 300):
        """
        Initialize cache
        
        Args:
            default_ttl: Default time-to-live in seconds (default: 5 minutes)
        """
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.default_ttl = default_ttl
    
    def _generate_key(self, prefix: str, data: Dict[str, Any]) -> str:
        """Generate cache key from prefix and data"""
        data_str = json.dumps(data, sort_keys=True)
        hash_obj = hashlib.md5(data_str.encode())
        return f"{prefix}:{hash_obj.hexdigest()}"
    
    def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache
        
        Args:
            key: Cache key
            
        Returns:
            Cached value or None if not found or expired
        """
        if key not in self.cache:
            return None
        
        entry = self.cache[key]
        
        # Check if expired
        if time.time() > entry['expires_at']:
            del self.cache[key]
            return None
        
        return entry['value']
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        """
        Set value in cache
        
        Args:
            key: Cache key
            value: Value to cache
            ttl: Time-to-live in seconds (optional, uses default if not specified)
        """
        expires_at = time.time() + (ttl or self.default_ttl)
        
        self.cache[key] = {
            'value': value,
            'expires_at': expires_at,
            'created_at': time.time()
        }
    
    def invalidate(self, key: str):
        """Invalidate cache entry"""
        if key in self.cache:
            del self.cache[key]
    
    def invalidate_prefix(self, prefix: str):
        """Invalidate all cache entries with given prefix"""
        keys_to_delete = [k for k in self.cache.keys() if k.startswith(prefix)]
        for key in keys_to_delete:
            del self.cache[key]
    
    def clear(self):
        """Clear entire cache"""
        self.cache.clear()
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        total_entries = len(self.cache)
        
        # Calculate cache size (approximate)
        total_size = sum(
            len(str(entry['value']))
            for entry in self.cache.values()
        )
        
        return {
            'total_entries': total_entries,
            'size_bytes': total_size,
            'size_kb': round(total_size / 1024, 2)
        }


# Global cache instance
cache = SimpleCache(default_ttl=300)  # 5 minutes default
