export type SearchOptions = {
  ignoreNoPrice: boolean;
  maxPages: number;
};

export type Product = {
  price: number;
  symbol: string;
  title: string;
  url: string;
  imageSrc: string;
  reviewCount: number;
  asin: string;
};

export type ProductFull = {
  price?: number;
  symbol?: string;
  title?: string;
  url?: string;
  imageSrc?: string;
  reviewCount?: number;
  asin?: string;
  stockText: string;
  images: string[];
  categories: string[];
  amazonChoice: boolean;
  discount: string;
  about: string[];
  soldBy: string;
  productDetails: { [p: string]: string };
  dispatchesFrom: string;
  delivery:
  | { deliveryPrice: string; arrival: string; within: string }
  | undefined;
};
export type JobResponse = {
  body: ProductSearch[] | ProductFull | ProductReviewPage[] | SellerDetails;
  totalPages?: number;
  totalResults: number;
  requestsConsumed: number
};
export type ProductSearch = {
  pageNum: number;
  products: Product[];
  ads?: Product[];
};

export type ProductReview = {
  profileName: string;
  title: string;
  reviewContent: string;
  id: string;
  dateText: string;
  ratingText: string;
  helpfulText: string;
  isVerified: boolean;
  images: (string | undefined)[]
};

export type ProductReviewPage = {
  pageNum: number;
  reviews: ProductReview[];
};

export type SellerDetails = {
  aboutText: string;
  name: string;
  url?: string;
  ratingText: string;
  businessInformation: { [key: string]: string };
};

export type Log = {
  type: "info" | "error";
  message: string;
  apiKey: string;
  timestamp: number;
  jobId: string;
};

export type Domain = "de" | "com";
export type Type =
  | "amazon_search"
  | "amazon_asin"
  | "product_reviews"
  | "product_details"
  | "seller_details";

export type Language = "en_GB" | "de_DE" | "cs_CZ" | "nl_NL" | "pl_PL" | "tr_TR" | "da_DK";
