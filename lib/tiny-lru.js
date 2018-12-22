/**
 * Tiny LRU cache for Client or Server
 *
 * @author Jason Mulligan <jason.mulligan@avoidwork.com>
 * @copyright 2018
 * @license BSD-3-Clause
 * @link https://github.com/avoidwork/tiny-lru
 * @version 5.1.0
 */
"use strict";

(function (global) {
	const empty = null;

	class LRUNode {
		constructor (key, value, expiry = -1, prev = null, next = null) {
			this.expiry = expiry;
			this.key = key;
			this.next = next;
			this.prev = prev;
			this.value = value;
		}
	}

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

					this.first = item;
				}
			} else {
				if (this.length === this.max) {
					this.remove(this.last.key, true);
				}

				this.length++;
				item = this.cache[key] = new LRUNode(key, value, this.ttl > 0 ? new Date().getTime() + this.ttl : -1, empty, this.first);

				if (this.length === 1) {
					this.last = item;
				} else {
					this.first.prev = item;
				}

				this.first = item;
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
