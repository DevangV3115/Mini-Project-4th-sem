import threading
import time


class FixedWindowRateLimiter:
    def __init__(self):
        self._lock = threading.Lock()
        self._buckets: dict[str, tuple[float, int]] = {}

    def allow(self, key: str, limit: int, window_seconds: int = 60) -> tuple[bool, int]:
        now = time.time()
        with self._lock:
            bucket = self._buckets.get(key)
            if bucket is None:
                self._buckets[key] = (now, 1)
                return True, 0

            window_start, count = bucket
            elapsed = now - window_start

            if elapsed >= window_seconds:
                self._buckets[key] = (now, 1)
                return True, 0

            if count >= limit:
                retry_after = max(1, int(window_seconds - elapsed))
                return False, retry_after

            self._buckets[key] = (window_start, count + 1)
            return True, 0

    def snapshot(self, window_seconds: int = 60) -> list[dict[str, int | str | float]]:
        now = time.time()
        items: list[dict[str, int | str | float]] = []
        with self._lock:
            stale_keys = []
            for key, (window_start, count) in self._buckets.items():
                elapsed = now - window_start
                if elapsed >= window_seconds:
                    stale_keys.append(key)
                    continue

                retry_after = max(0, int(window_seconds - elapsed))
                items.append(
                    {
                        "key": key,
                        "count": count,
                        "window_start_epoch": round(window_start, 3),
                        "retry_after_seconds": retry_after,
                    }
                )

            for key in stale_keys:
                self._buckets.pop(key, None)

        return items