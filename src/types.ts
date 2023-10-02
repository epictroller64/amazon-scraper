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
  reviews: string[];
  amazonChoice: boolean;
  productDetails: { [p: string]: string };
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
