	class LRUNode {
		constructor (arg, expiry = -1, prev = null, next = null) {
			this.expiry = expiry;
			this.prev = prev;
			this.next = next;
			this.value = arg;
		}
	}
