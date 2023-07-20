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
  stockText: string;
  images: string[];
  category: string;
  reviews: string[];
  amazonChoice: boolean;
  productDetails: {
    brand: string;
    series: string;
    weight: string;
    manufacturer: string;
    modelNumber: string;
    dimensions: string;
  };
};
