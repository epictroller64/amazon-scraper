import { search } from "./scraper";
import { performance } from "perf_hooks";
import { totalRequestSize } from "./logistics";
const a = performance.now();
search("intel", "de", { maxPages: 25, ignoreNoPrice: true }).then(() => {
  const b = performance.now();
  const d = b - a;
  console.log(
    "Done, took " +
      d +
      " milliseconds and used " +
      totalRequestSize.toFixed(2) +
      " MB",
  );
});
