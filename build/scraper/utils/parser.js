"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseLink = exports.parseReviews = exports.parseSellerDetails = exports.parseTableData = exports.parseProductDetails = void 0;
const node_html_parser_1 = require("node-html-parser");
const fs_1 = __importDefault(require("fs"));
function parseProductDetails(html) {
    const root = (0, node_html_parser_1.parse)(html);
    const productFull = {
        dispatchesFrom: "",
        delivery: undefined,
        amazonChoice: false,
        categories: [],
        images: [],
        productDetails: {},
        stockText: "",
        discount: "",
        about: [],
        soldBy: "",
    };
    const images = [];
    const stock = root.querySelector("#availability span.a-size-medium.a-color-success")
        ?.text || "";
    productFull.categories = root
        .querySelectorAll(".a-unordered-list.a-horizontal.a-size-small a")
        .map((item) => item.text.trim());
    productFull.stockText = stock;
    const imageScript = root.querySelectorAll("#imageBlock_feature_div script")[2]
        .text;
    const regexPattern = /"hiRes":\s*"(https:\/\/m\.media-amazon\.com\/images\/[^"]+)"/g;
    let match;
    while ((match = regexPattern.exec(imageScript)) !== null) {
        images.push(match[1]);
    }
    productFull.images = images;
    productFull.productDetails = parseTableData(root);
    productFull.price = parseInt(parsePrice(root)) || undefined;
    productFull.symbol = parsePriceSymbol(root);
    productFull.title = parseTitle(root);
    productFull.reviewCount = parseInt(parseReviewCount(root)) || undefined;
    productFull.asin = parseAsin(root);
    productFull.discount = parseDiscount(root);
    productFull.about = parseAboutBullets(root);
    productFull.soldBy = parseSoldBy(root);
    productFull.delivery = parseDeliveryData(root);
    productFull.dispatchesFrom = parseDispatchesFrom(root);
    return productFull;
}
exports.parseProductDetails = parseProductDetails;
function parseDeliveryData(root) {
    const deliveryInfoSpan = root.querySelector("[data-csa-c-content-id=DEXUnifiedCXPDM]");
    if (deliveryInfoSpan) {
        // Extracting the required information
        const deliveryPrice = deliveryInfoSpan.getAttribute("data-csa-c-delivery-price") || "";
        const arrival = deliveryInfoSpan.getAttribute("data-csa-c-delivery-time") || "";
        const within = deliveryInfoSpan.getAttribute("data-csa-c-delivery-cutoff") || "";
        // Constructing the object
        return {
            deliveryPrice,
            arrival,
            within,
        };
    }
}
function parseDispatchesFrom(root) {
    const containers = root.querySelectorAll("[data-csa-c-content-id=desktop-fulfiller-info]");
    if (containers.length > 2) {
        const container = containers[1];
        return container.textContent.trim() || "";
    }
    return "";
}
function parseSoldBy(root) {
    const soldByElement = root.querySelector("#sellerProfileTriggerId");
    return soldByElement ? soldByElement.textContent : "";
}
function parseAboutBullets(root) {
    const bulletDiv = root.querySelector("#feature-bullets");
    if (bulletDiv) {
        const listItems = bulletDiv.querySelectorAll(".a-list-item");
        return Array.from(listItems).map((item) => item.textContent.trim());
    }
    return [];
}
function parseAsin(root) {
    return root
        .querySelector("[data-csa-c-asin]:not([data-csa-c-asin=''])")
        ?.getAttribute("data-csa-c-asin");
}
function parseReviewCount(root) {
    return root.querySelector("#acrCustomerReviewText")?.text.split(" ")[0];
}
function parseTitle(root) {
    return root.querySelector("#productTitle")?.textContent.trim();
}
function parsePrice(root) {
    return (root.querySelector(".a-price-whole font")?.textContent ||
        root.querySelector(".a-price-whole")?.textContent);
}
function parseDiscount(root) {
    return (root.querySelector(".reinventPriceSavingsPercentageMargin")?.textContent ||
        "");
}
function parsePriceSymbol(root) {
    return root.querySelector(".a-price-symbol")?.text;
}
function parseTableData(root) {
    const result = {};
    const table = root.querySelector("#productDetails_techSpec_section_1") ||
        root.querySelector(".a-column.a-span6.block-content.block-type-table.textalign-left");
    if (!table) {
        return result;
    }
    const rows = table.querySelectorAll("tr");
    rows.forEach((row) => {
        const keyElement = row.querySelector("th");
        if (keyElement) {
            const valueElement = row.querySelector("td");
            if (keyElement && valueElement) {
                const key = keyElement.textContent?.trim() || "";
                result[key] = valueElement.textContent?.trim() || "";
            }
        }
        else {
            const tds = row.querySelectorAll("td");
            const key = tds[0].textContent?.trim() || "";
            result[key] = tds[1].textContent?.trim() || "";
        }
    });
    return result;
}
exports.parseTableData = parseTableData;
function parseSellerDetails(html, domain) {
    const element = (0, node_html_parser_1.parse)(html);
    const ratingElement = element.querySelector("#seller-info-feedback-summary");
    ratingElement?.querySelector("i")?.remove();
    let currentKey = "";
    const result = {};
    element
        .querySelector("#page-section-detail-seller-info")
        ?.querySelectorAll(".a-row")
        .forEach((row) => {
        const keyElement = row.querySelector(".a-text-bold");
        const valueElements = row.querySelectorAll("span:not(.a-text-bold)");
        // If keyElement exists, then either it's a new key-value pair or key with multi-line value
        if (keyElement) {
            if (valueElements.length > 0) {
                currentKey = keyElement.textContent.trim().replace(":", "");
                result[currentKey] = valueElements[0].textContent.trim();
            }
            else {
                currentKey = keyElement.textContent.trim().replace(":", "");
                result[currentKey] = "";
            }
        }
        else if (row.classList.contains("indent-left")) {
            // This checks for the indented values
            result[currentKey] += " " + row.textContent.trim();
        }
    });
    const sellerDetails = {
        aboutText: element.querySelector("#spp-expander-about-seller")?.textContent || "",
        name: element.querySelector("#seller-name")?.textContent || "",
        url: `https://amazon.${domain}/${element
            .querySelector("#seller-info-storefront-link a")
            ?.getAttribute("href") || ""}`,
        ratingText: ratingElement?.textContent || "",
        businessInformation: result,
    };
    return sellerDetails;
}
exports.parseSellerDetails = parseSellerDetails;
function parseReviews(html) {
    const element = (0, node_html_parser_1.parse)(html);
    fs_1.default.writeFileSync("revie.html", html);
    const reviews = [];
    const reviewElements = element.querySelectorAll("[data-hook='review']");
    console.log("review elements: " + reviewElements.length);
    for (const reviewElement of reviewElements) {
        const review = {
            dateText: reviewElement
                .querySelector("[data-hook='review-date']")
                ?.textContent.trim() || "",
            id: reviewElement.id,
            profileName: reviewElement.querySelector(".a-profile-name")?.textContent.trim() ||
                "",
            title: reviewElement.querySelector(".cr-original-review-content")
                ?.textContent || "",
            ratingText: reviewElement.querySelector("span.a-icon-alt")?.textContent.trim() ||
                "",
            reviewContent: reviewElement
                .querySelector("[data-hook='review-body']")
                ?.textContent.trim() || "",
            helpfulText: reviewElement
                .querySelector("[data-hook='helpful-vote-statement']")
                ?.textContent.trim() || "",
            isVerified: !!reviewElement.querySelector("[data-hook='avp-badge']"),
            images: reviewElement.querySelectorAll("[data-hook=review-image-tile]").map((image) => image.getAttribute("src")).map((image) => image?.replace("_SY88", "_SL1600_"))
        };
        reviews.push(review);
    }
    return reviews;
}
exports.parseReviews = parseReviews;
function parseLink(element) {
    const selectors = [
        ".a-link-normal.s-underline-text.s-underline-link-text.s-link-style.a-text-normal",
        ".a-link-normal.s-faceout-link.a-text-normal",
    ];
    for (const selector of selectors) {
        const selectorResult = element.querySelector(selector);
        if (!selectorResult) {
            continue;
        }
        const href = selectorResult.getAttribute("href");
        if (href && !href.startsWith("https://aax")) {
            return href;
        }
    }
    return;
}
exports.parseLink = parseLink;
//# sourceMappingURL=parser.js.map