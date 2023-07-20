export let totalRequestSize = 0;
export function collectRequestsize(size: number) {
  totalRequestSize += size;
  //console.log(`Total request size: ${totalRequestSize.toFixed(2)} MB`);
}
