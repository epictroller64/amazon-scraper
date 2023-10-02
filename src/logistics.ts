export let totalRequestSize = 0;
export let totalRequestCount = 0;
export function collectRequestsize(size: number) {
  totalRequestSize += size;
  //console.log(`Total request size: ${totalRequestSize.toFixed(2)} MB`);
}
export function reset() {
  totalRequestCount = 0;
  totalRequestSize = 0;
}
//adds up request
export function collectRequestCount() {
  totalRequestCount++;
}
