	class LRUNode {
		constructor (key, value, expiry = -1, prev = null, next = null) {
			this.expiry = expiry;
			this.key = key;
			this.next = next;
			this.prev = prev;
			this.value = value;
		}
	}
