"""
Thread-safe in-memory sliding window rate limiter for login and sensitive endpoints.
"""
from datetime import datetime, timezone
import threading
from typing import Dict, List, Tuple

from backend.app.core.config import settings


class SlidingWindowRateLimiter:
    """
    Sliding window in-memory rate limiter.
    Tracks timestamps of attempts per key (e.g. client IP or account identifier).
    """

    def __init__(self, max_requests: int = 10, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._lock = threading.Lock()
        self._history: Dict[str, List[float]] = {}

    def is_allowed(self, key: str) -> Tuple[bool, int]:
        """
        Checks whether the key is within the rate limit.
        Returns (is_allowed, remaining_attempts).
        """
        now = datetime.now(timezone.utc).timestamp()
        window_start = now - self.window_seconds

        with self._lock:
            # Clean expired timestamps
            timestamps = self._history.get(key, [])
            valid_timestamps = [t for t in timestamps if t > window_start]
            if not valid_timestamps:
                self._history.pop(key, None)
            else:
                self._history[key] = valid_timestamps

            # Evict stale keys if dictionary size exceeds threshold
            if len(self._history) > 1000:
                stale_keys = [k for k, v in self._history.items() if not v or v[-1] <= window_start]
                for k in stale_keys:
                    self._history.pop(k, None)

            if len(valid_timestamps) >= self.max_requests:
                return False, 0

            return True, self.max_requests - len(valid_timestamps)

    def cleanup_expired(self) -> int:
        """Removes expired entries from memory to prevent memory leaks."""
        now = datetime.now(timezone.utc).timestamp()
        window_start = now - self.window_seconds
        evicted = 0
        with self._lock:
            keys_to_remove = [k for k, v in self._history.items() if not v or v[-1] <= window_start]
            for k in keys_to_remove:
                self._history.pop(k, None)
                evicted += 1
        return evicted

    def record_attempt(self, key: str) -> None:
        """Records a new attempt timestamp."""
        now = datetime.now(timezone.utc).timestamp()
        with self._lock:
            if key not in self._history:
                self._history[key] = []
            self._history[key].append(now)

    def reset(self, key: str) -> None:
        """Clears history for a key upon successful authentication."""
        with self._lock:
            self._history.pop(key, None)

    def clear_all(self) -> None:
        """Clears all rate limit records (useful for test suites)."""
        with self._lock:
            self._history.clear()


# Global rate limiters
# 1. IP login rate limiter: Configurable (defaults to 500 attempts per minute per IP to support campus NAT)
login_ip_rate_limiter = SlidingWindowRateLimiter(
    max_requests=getattr(settings, "RATE_LIMIT_LOGIN_IP_MAX", 500), window_seconds=60
)

# 2. Account identifier rate limiter: 5 attempts per 2 minutes per account
login_identifier_rate_limiter = SlidingWindowRateLimiter(max_requests=5, window_seconds=120)

# 3. Dedicated student activation rate limiter: 5 attempts per 5 minutes per roll number
activation_identifier_rate_limiter = SlidingWindowRateLimiter(max_requests=5, window_seconds=300)

# 4. Public contact inquiry IP rate limiter: 5 inquiries per 10 minutes per IP
inquiry_ip_rate_limiter = SlidingWindowRateLimiter(max_requests=5, window_seconds=600)

