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
};
export type ProductSearch = {
  pageNum: number;
  products: Product[];
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
};

export type ProductReviewPage = {
  pageNum: number;
  reviews: ProductReview[];
};

export type SellerDetails = {
  aboutText: string;
  name: string;
  url: string;
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
