import axios, { AxiosError } from "axios";
import { parse } from "node-html-parser";
import {
  Domain,
  Language,
  Product,
  ProductReviewPage,
  ProductSearch,
  SearchOptions,
  SellerDetails,
} from "../types";
import { Request } from "../utils/requestManagerV2";
import {
  parseLink,
  parseProductDetails,
  parseReviews,
  parseSellerDetails,
} from "./utils/parser";

export class AmazonScraper {
  private readonly apiKey: string;
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  getSellerDetails(id: string, domain: Domain, language: Language) {
    return new Promise<SellerDetails>((resolve, reject) => {
      const fetch = async () => {
        try {
          const url = `https://www.amazon.${domain}/sp?language=${language}&ie=UTF8&seller=${id}`;
          const result = await Request.getRequest(url);
          const sellerDetails = parseSellerDetails(result.data.body);
          sellerDetails.url = url
          resolve(sellerDetails);
        } catch (e) {
          reject(e);
        }
      };
      fetch().then();
    });
  }
  getProductReviewsByAsin(
    asin: string,
    maxPages: number,
    language: Language,
    domain: Domain
  ) {
    const promises: Promise<ProductReviewPage>[] = [];
    for (let i = 1; i <= maxPages; i++) {
      const promise = new Promise<ProductReviewPage>((resolve, reject) => {
        const fetch = async () => {
          const i2 = i;
          const url = `https://www.amazon.${domain}/product-reviews/${asin}/ref=cm_cr_arp_d_paging_btm_next_${i2}?pageNumber=${i2}&language=${language}`;
          try {
            const response = await Request.getRequest(url);
            const reviewPageResponse: ProductReviewPage = {
              pageNum: i,
              reviews: parseReviews(response.data.body),
            };
            resolve(reviewPageResponse);
          } catch (e) {
            reject(e);
          }
        };
        fetch().then();
      });
      promises.push(promise);
    }
    return promises;
  }
  async getProductByAsin(asin: string, domain: Domain, langauge: Language) {
    const url = `https://amazon.${domain}/dp/${asin}&language=${langauge}`;
    const response = await Request.getRequest(url);
    parseProductDetails(response.data.body);
  }
  async getProductDetails(url: string) {
    const response = await Request.getRequest(url);
    const html = response.data.body;
    if (response.data.status_code !== 200) {
      throw new Error("Failed to complete the request");
    }
    const productFull = parseProductDetails(html);
    productFull.url = url;
    return productFull;
  }

  getProducts(
    html: string,
    ignoreNoPrice: boolean = false,
    domain: Domain,
    includeAds: boolean = false,
    language: Language
  ) {
    console.log(includeAds)
    const products: Product[] = [];
    const ads: Product[] = [];
    const root = parse(html);
    let selector =
      "div[data-asin]:not([value='']):not(.AdHolder)[data-uuid]:not(.s-widget-spacing-large)";
    if (includeAds) {
      console.log("ads included")
      selector =
        "div[data-asin]:not([value=''])[data-uuid]:not(.s-widget-spacing-large)";
    }
    const elements = root.querySelectorAll(selector);
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
      const title =
        element.querySelector(".a-size-medium.a-color-base.a-text-normal")
          ?.text ||
        element.querySelector(".a-size-base-plus.a-color-base.a-text-normal")
          ?.text ||
        element.querySelector(".a-size-small.a-color-base.a-text-normal")?.text;
      const price = element.querySelector(".a-price-whole");
      if (ignoreNoPrice) {
        if (!price) {
          continue;
        }
      }
      const reviewCount = element.querySelector(
        "span.a-size-base.s-underline-text",
      )?.text;
      const link = parseLink(element);
      const symbol = element.querySelector(".a-price-symbol");
      const image = element.querySelector("img.s-image")?.getAttribute("src");
      const asin = element.getAttribute("data-asin");
      if (symbol && link && image && title) {
        product.symbol = symbol.text;
        product.price = parseInt(price!.text);
        product.url = `https://www.amazon.${domain}${link}&language=${language}`;
        product.imageSrc = image;
        product.title = title;
        if (reviewCount) {
          product.reviewCount = parseInt(reviewCount);
        }
        if (asin) {
          product.asin = asin;
        }
        if (element.classList.contains("AdHolder")) {
          ads.push(product);
          continue;
        }
        products.push(product);
      }
    }
    return [products, ads];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async changeLocation(countryCode: string) {
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
    return await axios.get(url, {
      method: "POST",
      data: JSON.stringify(body),
    });
  }

  search(
    keyword: string,
    domain: Domain,
    options: SearchOptions = { ignoreNoPrice: true, maxPages: 1 },
    includeAds: boolean,
    language: Language
  ): Promise<ProductSearch>[] {
    const productSearchPromises: Promise<ProductSearch>[] = [];
    for (let i = 1; i <= options.maxPages; i++) {
      const url = `https://www.amazon.${domain}/s?k=${keyword}&page=${i}&language=${language}`;
      const promise = new Promise<ProductSearch>((resolve, reject) => {
        const fetch = async () => {
          try {
            const [p, a] = await this.fetchProductsFromUrl(
              url,
              options.ignoreNoPrice,
              domain,
              includeAds,
              language
            );
            const productSearch: ProductSearch = {
              pageNum: i,
              products: p,
            };
            if (a.length > 0) {
              productSearch.ads = a
            }
            resolve(productSearch);
          } catch (e) {
            reject(e);
          }
        };
        fetch().then();
      });
      productSearchPromises.push(promise);
    }
    return productSearchPromises;
  }

  async fetchProductsFromUrl(
    url: string,
    ignoreNoPrice: boolean,
    domain: Domain,
    includeAds: boolean,
    language: Language
  ) {
    const response = await Request.getRequest(url);
    if (!response) {
      console.log("false");
    }
    const html = response.data.body;
    return this.getProducts(html, ignoreNoPrice, domain, includeAds, language);
  }
}
