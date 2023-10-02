export interface JobModel {
  title:
    | "amazon_search"
    | "amazon_asin"
    | "product_reviews"
    | "product_details"
    | "seller_details";
  keyword: string;
  pages: number;
  domain: "de" | "com";
}
