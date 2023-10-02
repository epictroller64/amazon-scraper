export interface Proxy {
  protocol: string;
  host: string;
  port: number;
  auth?: {
    username: string;
    password: string;
  };
}

export class ProxyData {
  proxy: Proxy;
  isThrottled: boolean = false;
  currentUsers: number = 0;
  lock: Promise<void> = Promise.resolve();
  constructor(proxy: Proxy) {
    this.proxy = proxy;
  }

  public async waitUnlock() {
    //Waits til proxy gets unlocked, lock is 200ms default
    await this.lock;
  }
  public setUser() {
    this.currentUsers++;
    this.lock = new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 1000);
    });
    console.log(
      `${this.proxy.host} Upped the current users, count: ${this.currentUsers}`,
    );
    setTimeout(() => {
      this.currentUsers--;
      console.log(
        `${this.proxy.host} Lowered the current users, count: ${this.currentUsers}`,
      );
    }, 2000);
  }

  public setThrottled() {
    this.isThrottled = true;

    const minutes = 1;
    const milliseconds = minutes * 60 * 1000;
    setTimeout(() => {
      this.isThrottled = false;
    }, milliseconds);
  }
}
