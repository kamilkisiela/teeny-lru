interface Item<T> {
  prev: Item<T> | null;
  next: Item<T> | null;
  key: string;
  value: T;
  expiry: number;
}

export class LRU<TValue> {
  private first: Item<TValue> | null = null;
  private items: { [key: string]: Item<TValue> };
  private last: Item<TValue> | null = null;
  private ttl: number;
  private max: number;
  private size = 0;

  constructor({ max = 0, ttl = 0 }: { max?: number; ttl?: number }) {
    if (isNaN(max) || max < 0) {
      throw new TypeError("Invalid max value");
    }

    if (isNaN(ttl) || ttl < 0) {
      throw new TypeError("Invalid ttl value");
    }

    this.max = max;
    this.ttl = ttl;
  }

  has(key: string): boolean {
    return key in this.items;
  }

  clear() {
    this.first = null;
    this.items = Object.create(null);
    this.last = null;
    this.size = 0;
  }

  delete(key: string) {
    if (this.has(key)) {
      const item = this.items[key];

      delete this.items[key];
      this.size--;

      if (item.prev !== null) {
        item.prev.next = item.next;
      }

      if (item.next !== null) {
        item.next.prev = item.prev;
      }

      if (this.first === item) {
        this.first = item.next;
      }

      if (this.last === item) {
        this.last = item.prev;
      }
    }
  }

  evict() {
    const item = this.first;

    delete this.items[item.key];
    this.first = item.next;
    this.first.prev = null;
    this.size--;
  }

  get(key: string): TValue | undefined {
    let result: TValue;

    if (this.has(key)) {
      const item = this.items[key];

      if (this.ttl > 0 && item.expiry <= new Date().getTime()) {
        this.delete(key);
      } else {
        result = item.value;
        this.set(key, result, true);
      }
    }

    return result;
  }

  keys() {
    return Object.keys(this.items);
  }

  set(key: string, value: TValue, bypass = false) {
    let item: Item<TValue>;

    if (bypass || this.has(key)) {
      item = this.items[key];
      item.value = value;

      if (bypass === false) {
        item.expiry = this.ttl > 0 ? Date.now() + this.ttl : this.ttl;
      }

      if (this.last !== item) {
        const last = this.last,
          next = item.next,
          prev = item.prev;

        if (this.first === item) {
          this.first = item.next;
        }

        item.next = null;
        item.prev = this.last;
        last.next = item;

        if (prev !== null) {
          prev.next = next;
        }

        if (next !== null) {
          next.prev = prev;
        }
      }
    } else {
      if (this.max > 0 && this.size === this.max) {
        this.evict();
      }

      item = this.items[key] = {
        expiry: this.ttl > 0 ? Date.now() + this.ttl : this.ttl,
        key: key,
        prev: this.last,
        next: null,
        value,
      };

      if (++this.size === 1) {
        this.first = item;
      } else {
        this.last.next = item;
      }
    }

    this.last = item;
  }
}
