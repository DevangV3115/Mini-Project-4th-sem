from rate_limit import FixedWindowRateLimiter


def test_rate_limiter_blocks_after_limit():
    limiter = FixedWindowRateLimiter()
    key = "POST:/solve:127.0.0.1"

    allowed_1, _ = limiter.allow(key=key, limit=2, window_seconds=60)
    allowed_2, _ = limiter.allow(key=key, limit=2, window_seconds=60)
    allowed_3, retry_after = limiter.allow(key=key, limit=2, window_seconds=60)

    assert allowed_1 is True
    assert allowed_2 is True
    assert allowed_3 is False
    assert retry_after >= 1


def test_rate_limiter_enforces_single_request_limit_within_window():
    limiter = FixedWindowRateLimiter()
    key = "POST:/solve:127.0.0.1"

    allowed_1, _ = limiter.allow(key=key, limit=1, window_seconds=1)
    allowed_2, _ = limiter.allow(key=key, limit=1, window_seconds=1)

    assert allowed_1 is True
    assert allowed_2 is False
