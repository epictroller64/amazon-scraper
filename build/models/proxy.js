"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProxyData = void 0;
class ProxyData {
    proxy;
    isThrottled = false;
    currentUsers = 0;
    lock = Promise.resolve();
    constructor(proxy) {
        this.proxy = proxy;
    }
    async waitUnlock() {
        //Waits til proxy gets unlocked, lock is 200ms default
        await this.lock;
    }
    setUser() {
        this.currentUsers++;
        this.lock = new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, 1000);
        });
        console.log(`${this.proxy.host} Upped the current users, count: ${this.currentUsers}`);
        setTimeout(() => {
            this.currentUsers--;
            console.log(`${this.proxy.host} Lowered the current users, count: ${this.currentUsers}`);
        }, 2000);
    }
    setThrottled() {
        this.isThrottled = true;
        const minutes = 1;
        const milliseconds = minutes * 60 * 1000;
        setTimeout(() => {
            this.isThrottled = false;
        }, milliseconds);
    }
}
exports.ProxyData = ProxyData;
//# sourceMappingURL=proxy.js.map