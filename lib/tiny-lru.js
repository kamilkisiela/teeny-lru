/**
 * Tiny LRU cache for Client or Server
 *
 * @author Jason Mulligan <jason.mulligan@avoidwork.com>
 * @copyright 2018
 * @license BSD-3-Clause
 * @link https://github.com/avoidwork/tiny-lru
 * @version 5.0.0
 */
"use strict";

(function (global) {
	const empty = null;

	class LRU {
		constructor (max, ttl) {
			this.max = max;
			this.ttl = ttl;

			return this.clear();
		}

		clear () {
			const x = [];
			let i = -1;

			while (++i < this.max) x.push(`"s${i + 1}"`);

			this.first = empty;
			this.last = empty;
			this.registry = new Map();
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
				const item = this.slots[this.registry.get(key)];

				if (item.expiry === -1 || item.expiry > Date.now()) {
					result = item.value;
					this.set(key, result, true);
				} else {
					this.remove(key);
				}
			}

			return result;
		}

		has (key) {
			return this.registry.has(key);
		}

		remove (key, bypass = false) {
			if (bypass === true || this.has(key)) {
				const slot = this.registry.get(key);//,
				//item = this.slots[slot];

				this.slots[slot] = empty;
				this.registry.delete(key);
				this.empty.push(slot);
			}

			return this;
		}

		set (key, value, bypass = false) {
			if (bypass === true || this.has(key) === true) {
				const item = this.slots[this.registry.get(key)];

				item.value = value;

				if (this.first !== key) {
					const n = item.next,
						p = item.previous,
						f = this.slots[this.registry.get(this.first)];

					item.next = empty;
					item.previous = this.first;
					f.next = key;

					if (f.previous === key) {
						f.previous = empty;
					}

					if (n !== empty && n !== this.first) {
						if (p !== empty) {
							this.slots[this.registry.get(p)].next = n;
						}

						this.slots[this.registry.get(n)].previous = p;
					}

					if (this.last === key) {
						this.last = n;
					}

					this.first = key;
				}
			} else {
				if (this.empty.length === 0) {
					this.evict();
				}

				const slot = this.empty.pop();

				this.registry.set(key, slot);
				this.slots[slot] = {
					expiry: this.ttl > 0 ? new Date().getTime() + this.ttl : -1,
					next: empty,
					previous: this.first,
					value: value
				};

				if (this.last === empty) {
					this.last = key;
				} else {
					this.slots[this.registry.get(this.first)].next = key;
				}

				this.first = key;
			}

			return this;
		}
	}

	function factory (max = 1000, ttl = 0) {
		return new LRU(max, ttl);
	}

	// Node, AMD & window supported
	if (typeof exports !== "undefined") {
		module.exports = factory;
	} else if (typeof define === "function" && define.amd !== void 0) {
		define(() => factory);
	} else {
		global.lru = factory;
	}
}(typeof window !== "undefined" ? window : global));
