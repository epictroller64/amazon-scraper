import axios from "axios";
import { parse } from "node-html-parser";
import { Product, ProductFull, SearchOptions } from "./types";
import { axiosResponseIterceptor } from "./interceptor";
import { collectRequestsize, totalRequestSize } from "./logistics";

axios.interceptors.response.use(axiosResponseIterceptor);

async function getProduct(product: Product) {
  const response = await axios(product.url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
    },
  });
  const html = response.data;
  const root = parse(html);
  const productFull: ProductFull = {
    amazonChoice: false,
    category: "",
    images: [],
    productDetails: {
      brand: "",
      dimensions: "",
      manufacturer: "",
      modelNumber: "",
      series: "",
      weight: "",
    },
    reviews: [],
    stockText: "",
  };
  const images: string[] = [];
  const stock = root.querySelector(
    "#availability span.a-size-medium.a-color-success",
  )?.text;
  const categories = root
    .querySelectorAll(".a-unordered-list.a-horizontal.a-size-small a")
    .map((item) => item.text.trim());
}
async function getProducts(
  html: string,
  ignoreNoPrice: boolean = false,
  domain: "de" | "com",
) {
  const products: Product[] = [];
  const root = parse(html);
  const elements = root.querySelectorAll(
    "div[data-asin]:not([value='']):not(.AdHolder)[class*='sg-col-20-of-24']",
  );
  for (const element of elements) {
    const product: Product = {
      asin: "",
      imageSrc: "",
      price: 0,
      symbol: "",
      title: "",
      url: "",
      reviewCount: 0,
    };
    const title = element.querySelector(
      ".a-size-medium.a-color-base.a-text-normal",
    )?.text;
    const price = element.querySelector(".a-price-whole");
    if (ignoreNoPrice) {
      if (!price) {
        continue;
      }
    }
    const reviewCount = element.querySelector(
      "span.a-size-base.s-underline-text",
    )?.text;
    const symbol = element.querySelector(".a-price-symbol");
    const link = element
      .querySelector(
        ".a-link-normal.s-underline-text.s-underline-link-text.s-link-style.a-text-normal",
      )
      ?.getAttribute("href");
    const image = element.querySelector("img.s-image")?.getAttribute("src");
    const asin = element.getAttribute("data-asin");
    if (symbol && link && image && title) {
      product.symbol = symbol.text;
      product.price = parseInt(price!.text);
      product.url = `https://amazon.${domain}${link}`;
      product.imageSrc = image;
      product.title = title;
      if (reviewCount) {
        product.reviewCount = parseInt(reviewCount);
      }
      if (asin) {
        product.asin = asin;
      }
      products.push(product);
      //console.log(`${symbol?.text}${price?.text} - ${title} - ${image}`);
    }
  }
  return products;
}

async function changeLocation(countryCode: string) {
  const body = {
    locationType: "COUNTRY",
    district: countryCode,
    countryCode: countryCode,
    storeContext: "pc",
    deviceType: "web",
    pageType: "Detail",
    actionSource: "glow",
  };
  const url =
    "https://www.amazon.com/portal-migration/hz/glow/address-change?actionSource=glow";
  const response = await axios(url, {
    method: "POST",
    data: JSON.stringify(body),
  });
}

export async function search(
  keyword: string,
  domain: "de" | "com",
  options: SearchOptions = { ignoreNoPrice: true, maxPages: 1 },
) {
  for (let i = 1; i <= options.maxPages; i++) {
    const url = `https://amazon.de/s?k=${keyword}&page=${i}`;
    const response = await axios(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
      },
    });
    const html = response.data;
    const products = await getProducts(html, options.ignoreNoPrice, domain);
    for (const product of products) {
      console.log("-------------------------");
      console.log(product);
      //await getProduct(product);
    }
  }
}
