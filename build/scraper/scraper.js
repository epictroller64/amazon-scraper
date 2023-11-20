"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmazonScraper = void 0;
const axios_1 = __importDefault(require("axios"));
const node_html_parser_1 = require("node-html-parser");
const requestManagerV2_1 = require("../utils/requestManagerV2");
const parser_1 = require("./utils/parser");
class AmazonScraper {
    apiKey;
    constructor(apiKey) {
        this.apiKey = apiKey;
    }
    getSellerDetails(id, domain, language) {
        return new Promise((resolve, reject) => {
            const fetch = async () => {
                try {
                    const url = `https://www.amazon.${domain}/sp?language=${language}&ie=UTF8&seller=${id}`;
                    const result = await requestManagerV2_1.Request.getRequest(url);
                    const sellerDetails = (0, parser_1.parseSellerDetails)(result.data.body);
                    sellerDetails.url = url;
                    resolve(sellerDetails);
                }
                catch (e) {
                    reject(e);
                }
            };
            fetch().then();
        });
    }
    getProductReviewsByAsin(asin, maxPages, language, domain) {
        const promises = [];
        for (let i = 1; i <= maxPages; i++) {
            const promise = new Promise((resolve, reject) => {
                const fetch = async () => {
                    const i2 = i;
                    const url = `https://www.amazon.${domain}/product-reviews/${asin}/ref=cm_cr_arp_d_paging_btm_next_${i2}?pageNumber=${i2}&language=${language}`;
                    try {
                        const response = await requestManagerV2_1.Request.getRequest(url);
                        const reviewPageResponse = {
                            pageNum: i,
                            reviews: (0, parser_1.parseReviews)(response.data.body),
                        };
                        resolve(reviewPageResponse);
                    }
                    catch (e) {
                        reject(e);
                    }
                };
                fetch().then();
            });
            promises.push(promise);
        }
        return promises;
    }
    async getProductByAsin(asin, domain, langauge) {
        const url = `https://amazon.${domain}/dp/${asin}&language=${langauge}`;
        const response = await requestManagerV2_1.Request.getRequest(url);
        (0, parser_1.parseProductDetails)(response.data.body);
    }
    async getProductDetails(url) {
        const response = await requestManagerV2_1.Request.getRequest(url);
        const html = response.data.body;
        if (response.data.status_code !== 200) {
            throw new Error("Failed to complete the request");
        }
        const productFull = (0, parser_1.parseProductDetails)(html);
        productFull.url = url;
        return productFull;
    }
    getProducts(html, ignoreNoPrice = false, domain, includeAds = false, language) {
        console.log(includeAds);
        const products = [];
        const ads = [];
        const root = (0, node_html_parser_1.parse)(html);
        let selector = "div[data-asin]:not([value='']):not(.AdHolder)[data-uuid]:not(.s-widget-spacing-large)";
        if (includeAds) {
            selector =
                "div[data-asin]:not([value=''])[data-uuid]:not(.s-widget-spacing-large)";
        }
        const elements = root.querySelectorAll(selector);
        for (const element of elements) {
            const product = {
                asin: "",
                imageSrc: "",
                price: 0,
                symbol: "",
                title: "",
                url: "",
                reviewCount: 0,
            };
            const title = element.querySelector(".a-size-medium.a-color-base.a-text-normal")
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
            const reviewCount = element.querySelector("span.a-size-base.s-underline-text")?.text;
            const link = (0, parser_1.parseLink)(element);
            const symbol = element.querySelector(".a-price-symbol");
            const image = element.querySelector("img.s-image")?.getAttribute("src");
            const asin = element.getAttribute("data-asin");
            if (symbol && link && image && title) {
                product.symbol = symbol.text;
                product.price = parseInt(price.text);
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
    async changeLocation(countryCode) {
        const body = {
            locationType: "COUNTRY",
            district: countryCode,
            countryCode: countryCode,
            storeContext: "pc",
            deviceType: "web",
            pageType: "Detail",
            actionSource: "glow",
        };
        const url = "https://www.amazon.com/portal-migration/hz/glow/address-change?actionSource=glow";
        return await axios_1.default.get(url, {
            method: "POST",
            data: JSON.stringify(body),
        });
    }
    search(keyword, domain, options = { ignoreNoPrice: true, maxPages: 1 }, includeAds, language) {
        const productSearchPromises = [];
        for (let i = 1; i <= options.maxPages; i++) {
            const url = `https://www.amazon.${domain}/s?k=${keyword}&page=${i}&language=${language}`;
            const promise = new Promise((resolve, reject) => {
                const fetch = async () => {
                    try {
                        const [p, a] = await this.fetchProductsFromUrl(url, options.ignoreNoPrice, domain, includeAds, language);
                        const productSearch = {
                            pageNum: i,
                            products: p,
                        };
                        if (a.length > 0) {
                            productSearch.ads = a;
                        }
                        resolve(productSearch);
                    }
                    catch (e) {
                        reject(e);
                    }
                };
                fetch().then();
            });
            productSearchPromises.push(promise);
        }
        return productSearchPromises;
    }
    async fetchProductsFromUrl(url, ignoreNoPrice, domain, includeAds, language) {
        const response = await requestManagerV2_1.Request.getRequest(url);
        if (!response) {
            console.log("false");
        }
        const html = response.data.body;
        return this.getProducts(html, ignoreNoPrice, domain, includeAds, language);
    }
}
exports.AmazonScraper = AmazonScraper;
//# sourceMappingURL=scraper.js.map