interface Item<T> {
  prev: Item<T> | null;
  next: Item<T> | null;
  key: string;
  value: T;
  expiry: number;
}

function isStale<T>(item: Item<T>): boolean {
  return item.expiry <= Date.now();
}

interface Store<TValue> {
  first: Item<TValue> | null;
  items: { [key: string]: Item<TValue> };
  last: Item<TValue> | null;
  ttl: number;
  max: number;
  size: number;
  onDispose(key: string, value: TValue): void;
}

interface LRU<TValue> {
  has(key: string): boolean;
  clear(): void;
  delete(key: string): void;
  evict(): void;
  get(key: string): TValue | undefined;
  keys(): string[];
  set(key: string, value: TValue, bypass?: boolean): void;
  size(): number;
  prune(): void;
}

function has<T>(store: Store<T>, key: string): boolean {
  return key in store.items;
}

function clear<T>(store: Store<T>) {
  store.first = null;
  store.items = Object.create(null);
  store.last = null;
  store.size = 0;
}

function del<T>(store: Store<T>, key: string) {
  if (has(store, key)) {
    const item = store.items[key];

    store.onDispose(key, item.value);

    delete store.items[key];
    store.size--;

    if (item.prev !== null) {
      item.prev.next = item.next;
    }

    if (item.next !== null) {
      item.next.prev = item.prev;
    }

    if (store.first === item) {
      store.first = item.next;
    }

    if (store.last === item) {
      store.last = item.prev;
    }
  }
}

function evict<T>(store: Store<T>) {
  const item = store.first;

  store.onDispose(item.key, item.value);

  delete store.items[item.key];
  store.first = item.next;
  store.first.prev = null;
  store.size--;
}

function get<T>(store: Store<T>, key: string): T | undefined {
  let result: T;

  if (has(store, key)) {
    const item = store.items[key];

    if (store.ttl > 0 && isStale(item)) {
      del(store, key);
    } else {
      result = item.value;
      set(store, key, result, true);
    }
  }

  return result;
}

function keys<T>(store: Store<T>) {
  return Object.keys(store.items);
}

function set<T>(store: Store<T>, key: string, value: T, bypass = false) {
  let item: Item<T>;

  if (bypass || has(store, key)) {
    item = store.items[key];
    item.value = value;

    if (bypass === false) {
      item.expiry = store.ttl > 0 ? Date.now() + store.ttl : store.ttl;
    }

    if (store.last !== item) {
      const last = store.last,
        next = item.next,
        prev = item.prev;

      if (store.first === item) {
        store.first = item.next;
      }

      item.next = null;
      item.prev = store.last;
      last.next = item;

      if (prev !== null) {
        prev.next = next;
      }

      if (next !== null) {
        next.prev = prev;
      }
    }
  } else {
    if (store.max > 0 && store.size === store.max) {
      evict(store);
    }

    item = store.items[key] = {
      expiry: store.ttl > 0 ? Date.now() + store.ttl : store.ttl,
      key: key,
      prev: store.last,
      next: null,
      value,
    };

    if (++store.size === 1) {
      store.first = item;
    } else {
      store.last.next = item;
    }
  }

  store.last = item;
}

function prune<T>(store: Store<T>): void {
  const list = keys(store);

  for (const key of list) {
    get(store, key);
  }
}

export function createLRU<TValue>({
  max = 0,
  ttl = 0,
  onDispose = () => {},
}: {
  max?: number;
  ttl?: number;
  onDispose?: (key: string, value: TValue) => void;
}): LRU<TValue> {
  if (isNaN(max) || max < 0) {
    throw new TypeError("Invalid max value");
  }

  if (isNaN(ttl) || ttl < 0) {
    throw new TypeError("Invalid ttl value");
  }

  const store: Store<TValue> = {
    max,
    ttl,
    first: null,
    last: null,
    items: {},
    size: 0,
    onDispose,
  };

  return {
    set(key: string, value: TValue, bypass?: boolean) {
      return set(store, key, value, bypass);
    },
    get(key: string) {
      return get(store, key);
    },
    delete(key: string) {
      return del(store, key);
    },
    has(key: string) {
      return has(store, key);
    },
    keys() {
      return keys(store);
    },
    evict() {
      return evict(store);
    },
    prune() {
      return prune(store);
    },
    clear() {
      return clear(store);
    },
    size() {
      return store.size;
    }
  };
}
