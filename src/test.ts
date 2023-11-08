import { AmazonScraper } from "./scraper/scraper";

type TestParams = {
  perMinute: number;
  minutes: number;
};

export function testLoad(params: TestParams) {
  const scraper = new AmazonScraper("testkey");
  let index = 0;
  let success = 0;
  let fails = 0;
  const timer = setInterval(() => {
    if (index >= params.minutes) {
      console.log(`End. Success: ${success}, Failed: ${fails}`);
      clearInterval(timer);
      return;
    }
    index = index + 1;
    console.log(`Round ${index}`);
    for (let i = 0; i < params.perMinute; i++) {
      try {
        scraper.search("intel", "de", {
          maxPages: 1,
          ignoreNoPrice: true,
        });
        success++;
      } catch (e) {
        fails++;
      }
    }
  }, 60 * 1000);
}

testLoad({
  perMinute: 1000,
  minutes: 2,
});
