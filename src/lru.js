	class LRU {
		constructor (max, ttl) {
			this.clear();
			this.max = max;
			this.ttl = ttl;
		}

		clear () {
			this.cache = {};
			this.first = empty;
			this.last = empty;
			this.length = 0;

			return this;
		}

		delete (key, bypass = false) {
			return this.remove(key, bypass);
		}

		evict () {
			if (this.length > 0) {
				this.remove(this.last.key, true);
			}

			return this;
		}

		get (key) {
			let result;

			if (this.has(key) === true) {
				const item = this.cache[key];

				if (item.expiry === -1 || item.expiry > Date.now()) {
					result = item.value;
					this.set(key, result, true);
				} else {
					this.remove(key, true);
				}
			}

			return result;
		}

		has (key) {
			return key in this.cache;
		}

		remove (key, bypass = false) {
			if (bypass === true || this.has(key) === true) {
				const item = this.cache[key];

				delete this.cache[key];
				this.length--;

				if (item.next !== empty) {
					item.next.prev = item.prev;
				}

				if (item.prev !== empty) {
					item.prev.next = item.next;
				}

				if (this.first === item) {
					this.first = item.next;
				}

				if (this.last === item) {
					this.last = item.prev;
				}
			}

			return this;
		}

		set (key, value, bypass = false) {
			let item;

			if (bypass === true || this.has(key) === true) {
				item = this.cache[key];
				item.value = value;

				if (this.first !== item) {
					const p = item.prev,
						n = item.next,
						f = this.first;

					item.prev = empty;
					item.next = this.first;
					f.prev = item;

					if (p !== empty) {
						p.next = n;
					}

					if (n !== empty) {
						n.prev = p;
					}

					if (this.last === item) {
						this.last = p;
					}
				}
			} else {
				if (this.length === this.max) {
					this.evict();
				}

				this.length++;
				item = this.cache[key] = new LRUNode(key, value, this.ttl > 0 ? new Date().getTime() + this.ttl : -1, empty, this.first);

				if (this.length === 1) {
					this.last = item;
				} else {
					this.first.prev = item;
				}
			}

			this.first = item;

			return this;
		}
	}
