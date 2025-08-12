import time
from dataclasses import dataclass

import boto3
from botocore.config import Config


@dataclass
class TokenBucketConfig:
    rate_per_minute: int
    burst_size: int
    table_name: str = "RateLimitBuckets"


class TokenBucket:
    """Simple DynamoDB token bucket."""

    def __init__(self, config: TokenBucketConfig) -> None:
        self.rate = config.rate_per_minute
        self.capacity = config.burst_size
        self.interval = 60
        self.table = boto3.resource("dynamodb", config=Config(retries={"max_attempts": 1})).Table(config.table_name)

    def should_throttle(self, bucket_id: str) -> bool:
        now = int(time.time())
        try:
            resp = self.table.get_item(Key={"bucket_id": bucket_id})
            item = resp.get("Item", {})
        except Exception:
            item = {}

        tokens = item.get("token_count", self.capacity)
        last_updated = item.get("last_updated", now)

        # refill tokens based on elapsed time
        elapsed = now - last_updated
        tokens = min(self.capacity, tokens + (elapsed * self.rate) // self.interval)

        if tokens <= 0:
            new_tokens = tokens
            throttle = True
        else:
            new_tokens = tokens - 1
            throttle = False

        try:
            self.table.put_item(Item={"bucket_id": bucket_id, "token_count": int(new_tokens), "last_updated": now})
        except Exception:
            pass

        return throttle
