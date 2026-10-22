declare const brand: unique symbol;

// 같은 원시 타입이라도 이름이 다르면 섞이지 않는다: Brand<string, "InquiryId">
export type Brand<T, K extends string> = T & { readonly [brand]: K };
