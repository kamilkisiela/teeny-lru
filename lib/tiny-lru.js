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
			this.cache = new Map();
			this.first = empty;
			this.last = empty;
			this.max = max;
			this.ttl = ttl;
		}

		clear () {
			this.cache.clear();
			this.first = empty;
			this.last = empty;

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
				const item = this.cache.get(key);

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
			return this.cache.has(key);
		}

		remove (key, bypass = false) {
			let result;

			if (bypass === true || this.has(key) === true) {
				result = this.cache.get(key);
				this.cache.delete(key);

				if (result.previous !== empty) {
					this.cache.set(result.previous, Object.assign(this.cache.get(result.previous), {next: result.next}));
				}

				if (result.next !== empty) {
					this.cache.set(result.next, Object.assign(this.cache.get(result.next), {previous: result.previous}));
				}

				if (this.first === key) {
					this.first = result.previous;
				}

				if (this.last === key) {
					this.last = result.next;
				}
			}

			return result;
		}

		set (key, value, bypass = false) {
			if (bypass === true || this.has(key) === true) {
				const item = this.cache.get(key);

				item.value = value;

				if (this.first !== key) {
					const n = item.next,
						p = item.previous,
						f = this.cache.get(this.first);

					item.next = empty;
					item.previous = this.first;
					f.next = key;

					if (f.previous === key) {
						f.previous = empty;
					}

					this.cache.set(this.first, f);

					if (n !== empty && n !== this.first) {
						if (p !== empty) {
							this.cache.set(p, Object.assign(this.cache.get(p), {next: n}));
						}

						this.cache.set(n, Object.assign(this.cache.get(n), {previous: p}));
					}

					if (this.last === key) {
						this.last = n;
					}
				}

				this.cache.set(key, item);
			} else {
				if (this.cache.size === this.max) {
					this.evict();
				}

				this.cache.set(key, {
					expiry: this.ttl > 0 ? new Date().getTime() + this.ttl : -1,
					next: empty,
					previous: this.first,
					value: value
				});

				if (this.cache.size === 1) {
					this.last = key;
				} else {
					this.cache.set(this.first, Object.assign(this.cache.get(this.first), {next: key}));
				}
			}

			this.first = key;

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
