import Cache from "../models/cacheModel";
import {
  deleteByKey,
  getValueByKey,
  storeKeyValue,
} from "../repositories/cacheRepository";

export async function insertCache(key: string, value: any) {
  const timestamp = Math.floor(new Date().getTime() / 1000);
  if (typeof value !== "string") {
    value = JSON.stringify(value)
  }
  await storeKeyValue(key, value, timestamp);
}

export async function removeCache(key: string) {
  await deleteByKey(key);
}

export async function getCache(key: string) {
  const cachedValue: Cache | null = (await getValueByKey(key)) as Cache | null;
  if (cachedValue && cachedValue.length > 0) {
    const currentTimestamp = Math.floor(new Date().getTime() / 1000);
    if (currentTimestamp - 86400 < cachedValue.timestamp) {
      return null;
    }
    return cachedValue;
  }
  return null;
}
