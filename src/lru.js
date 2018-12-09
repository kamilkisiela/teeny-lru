	class LRU {
		constructor (max, ttl) {
			this.max = max;
			this.size = 0;
			this.ttl = ttl;

			return this.clear();
		}

		clear () {
			const x = [];
			let i = -1;

			while (++i < this.max) x.push(`"s${i + 1}"`);

			this.first = empty;
			this.last = empty;
			this.registry = {};
			this.size = 0;
			this.slots = JSON.parse(`{${x.map(g => `${g}: {"expiry":-1,"next":null,"previous":null,"value":null}`).join(",")}}`);
			this.empty = Object.keys(this.slots).reverse();

			return this;
		}

		delete (key, bypass = false) {
			return this.remove(key, bypass);
		}

		evict () {
			return this.remove(this.last, true);
		}

		get (key) {
			let result;

			if (this.has(key) === true) {
				const item = this.slots[this.registry[key]];

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
			return key in this.registry;
		}

		remove (key, bypass = false) {
			if (bypass === true || this.has(key) === true) {
				const slot = this.registry[key],
					item = this.slots[slot];

				delete this.registry[key];
				this.empty.push(slot);
				this.size--;

				if (item.previous !== empty) {
					this.slots[this.registry[item.previous]].next = item.next;
				}

				if (item.next !== empty) {
					this.slots[this.registry[item.next]].previous = item.previous;
				}

				if (this.first === key) {
					this.first = item.previous;
				}

				if (this.last === key) {
					this.last = item.next;
				}

				item.expiry = -1;
				item.next = empty;
				item.previous = empty;
				item.value = empty;
			}

			return this;
		}

		set (key, value, bypass = false) {
			if (bypass === true || this.has(key) === true) {
				const item = this.slots[this.registry[key]];

				item.value = value;

				if (this.first !== key) {
					const n = item.next,
						p = item.previous,
						f = this.slots[this.registry[this.first]];

					item.next = empty;
					item.previous = this.first;
					f.next = key;

					if (f.previous === key) {
						f.previous = empty;
					}

					if (n !== empty && n !== this.first) {
						if (p !== empty) {
							this.slots[this.registry[p]].next = n;
						}

						this.slots[this.registry[n]].previous = p;
					}

					if (this.last === key) {
						this.last = n;
					}

					this.first = key;
				}
			} else {
				if (this.size === this.max) {
					this.evict();
				}

				const slot = this.empty.pop(),
					item = this.slots[slot];

				this.registry[key] = slot;
				item.expiry = this.ttl > 0 ? new Date().getTime() + this.ttl : -1;
				item.next = empty;
				item.previous = this.first;
				item.value = value;

				if (this.last === empty) {
					this.last = key;
				} else {
					this.slots[this.registry[this.first]].next = key;
				}

				this.first = key;
				this.size++;
			}

			return this;
		}
	}
