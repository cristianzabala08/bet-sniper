export interface ResponsePagintation<T> {
  rows: T;
  totalRow: number;
}

export interface ResponseApis<T> {
  data: T;
}