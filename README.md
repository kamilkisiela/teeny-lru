# Teeny LRU

Least Recently Used cache

```typescript
import { createLRU } from "teeny-lru";

const cache = createLRU({
  max: 100,
  ttl: 0,
  onDispose(key, value) {
    console.log(`Disposed ${key}`);
  },
});

// Clears the contents of the cache
cache.clear();

// Removes item from cache
cache.delete("key");

// Evicts the least recently used item from cache
cache.evict();

// Gets cached item and moves it to the front
cache.get("key");

// Returns an `Array` of cache item keys.
cache.keys();

// Sets item in cache as `first`
cache.set("myKey", { prop: true });

// Removes stale items
cache.prune();

// Number of items in cache
cache.size();
```

## License

Copyright (c) 2021 Kamil Kisiela
Licensed under the MIT license.
