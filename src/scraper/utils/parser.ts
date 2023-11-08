import { HTMLElement, parse } from "node-html-parser";
import { ProductFull, ProductReview, SellerDetails } from "../../types";

export function parseProductDetails(html: string) {
  const root = parse(html);
  const productFull: ProductFull = {
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
  const images: string[] = [];
  const stock =
    root.querySelector("#availability span.a-size-medium.a-color-success")
      ?.text || "";
  productFull.categories = root
    .querySelectorAll(".a-unordered-list.a-horizontal.a-size-small a")
    .map((item) => item.text.trim());
  productFull.stockText = stock;
  const imageScript = root.querySelectorAll("#imageBlock_feature_div script")[2]
    .text;
  const regexPattern =
    /"hiRes":\s*"(https:\/\/m\.media-amazon\.com\/images\/[^"]+)"/g;
  let match;
  while ((match = regexPattern.exec(imageScript)) !== null) {
    images.push(match[1]);
  }
  productFull.images = images;
  productFull.productDetails = parseTableData(root);
  productFull.price = parseInt(parsePrice(root)!) || undefined;
  productFull.symbol = parsePriceSymbol(root);
  productFull.title = parseTitle(root);
  productFull.reviewCount = parseInt(parseReviewCount(root)!) || undefined;
  productFull.asin = parseAsin(root);
  productFull.discount = parseDiscount(root);
  productFull.about = parseAboutBullets(root);
  productFull.soldBy = parseSoldBy(root);
  productFull.delivery = parseDeliveryData(root);
  productFull.dispatchesFrom = parseDispatchesFrom(root);
  return productFull;
}

function parseDeliveryData(root: HTMLElement) {
  const deliveryInfoSpan = root.querySelector(
    "[data-csa-c-content-id=DEXUnifiedCXPDM]",
  );

  if (deliveryInfoSpan) {
    // Extracting the required information
    const deliveryPrice =
      deliveryInfoSpan.getAttribute("data-csa-c-delivery-price") || "";
    const arrival =
      deliveryInfoSpan.getAttribute("data-csa-c-delivery-time") || "";
    const within =
      deliveryInfoSpan.getAttribute("data-csa-c-delivery-cutoff") || "";

    // Constructing the object
    return {
      deliveryPrice,
      arrival,
      within,
    };
  }
}
function parseDispatchesFrom(root: HTMLElement) {
  const containers = root.querySelectorAll(
    "[data-csa-c-content-id=desktop-fulfiller-info]",
  );
  if (containers.length > 2) {
    const container = containers[1];
    return container.textContent.trim() || "";
  }
  return "";
}
function parseSoldBy(root: HTMLElement) {
  const soldByElement = root.querySelector("#sellerProfileTriggerId");
  return soldByElement ? soldByElement.textContent : "";
}
function parseAboutBullets(root: HTMLElement) {
  const bulletDiv = root.querySelector("#feature-bullets");
  if (bulletDiv) {
    const listItems = bulletDiv.querySelectorAll(".a-list-item");
    return Array.from(listItems).map((item) => item.textContent.trim());
  }
  return [];
}
function parseAsin(root: HTMLElement) {
  return root
    .querySelector("[data-csa-c-asin]:not([data-csa-c-asin=''])")
    ?.getAttribute("data-csa-c-asin");
}

function parseReviewCount(root: HTMLElement) {
  return root.querySelector("#acrCustomerReviewText")?.text.split(" ")[0];
}

function parseTitle(root: HTMLElement) {
  return root.querySelector("#productTitle")?.textContent.trim();
}

function parsePrice(root: HTMLElement) {
  return (
    root.querySelector(".a-price-whole font")?.textContent ||
    root.querySelector(".a-price-whole")?.textContent
  );
}
function parseDiscount(root: HTMLElement) {
  return (
    root.querySelector(".reinventPriceSavingsPercentageMargin")?.textContent ||
    ""
  );
}
function parsePriceSymbol(root: HTMLElement) {
  return root.querySelector(".a-price-symbol")?.text;
}
export function parseTableData(root: HTMLElement): { [key: string]: string } {
  const result: { [key: string]: string } = {};
  const table =
    root.querySelector("#productDetails_techSpec_section_1") ||
    root.querySelector(
      ".a-column.a-span6.block-content.block-type-table.textalign-left",
    );
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
    } else {
      const tds = row.querySelectorAll("td");
      const key = tds[0].textContent?.trim() || "";
      result[key] = tds[1].textContent?.trim() || "";
    }
  });
  return result;
}
export function parseSellerDetails(html: string) {
  const element = parse(html);
  const ratingElement = element.querySelector("#seller-info-feedback-summary");
  ratingElement?.querySelector("i")?.remove();
  let currentKey = "";
  const result: { [key: string]: string } = {};
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
        } else {
          currentKey = keyElement.textContent.trim().replace(":", "");
          result[currentKey] = "";
        }
      } else if (row.classList.contains("indent-left")) {
        // This checks for the indented values
        result[currentKey] += " " + row.textContent.trim();
      }
    });

  const sellerDetails: SellerDetails = {
    aboutText:
      element.querySelector("#spp-expander-about-seller")?.textContent || "",
    name: element.querySelector("#seller-name")?.textContent || "",
    url:
      element
        .querySelector("#seller-info-storefront-link a")
        ?.getAttribute("href") || "",
    ratingText: ratingElement?.textContent || "",
    businessInformation: result,
  };
  return sellerDetails;
}
export function parseReviews(html: string) {
  const element = parse(html);
  const reviews: ProductReview[] = [];
  const reviewElements = element.querySelectorAll("[data-hook='review']");
  for (const reviewElement of reviewElements) {
    const review: ProductReview = {
      dateText:
        reviewElement
          .querySelector("[data-hook='review-date']")
          ?.textContent.trim() || "",
      id: reviewElement.id,
      profileName:
        reviewElement.querySelector(".a-profile-name")?.textContent.trim() ||
        "",
      title:
        reviewElement.querySelector(".cr-original-review-content")
          ?.textContent || "",
      ratingText:
        reviewElement.querySelector("span.a-icon-alt")?.textContent.trim() ||
        "",
      reviewContent:
        reviewElement
          .querySelector("[data-hook='review-body']")
          ?.textContent.trim() || "",
      helpfulText:
        reviewElement
          .querySelector("[data-hook='helpful-vote-statement']")
          ?.textContent.trim() || "",
      isVerified: !!reviewElement.querySelector("[data-hook='avp-badge']"),
    };
    reviews.push(review);
  }
  return reviews;
}

export function parseLink(element: HTMLElement) {
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
