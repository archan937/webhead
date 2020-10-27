type Headers = Record<string, string>;

export interface WebheadOptions {
  jarFile?: string;
  userAgent?: string;
  verbose?: boolean;
  beforeSend(
    parameters: WebheadRequestParameters,
    session: object,
  ): WebheadRequestParameters;
  complete(
    parameters: WebheadRequestParameters,
    session: object,
    webhead: WebheadInstance,
  ): void;
}

export interface WebheadRequestParameters {
  method: string;
  url: string;
  options: WebheadRequestOptions;
}

export interface WebheadRequestOptions {
  headers?: Headers;
  data?: object;
  multiPartData?: object;
  json?: object;
}

export interface WebheadResponse {
  statusCode: number;
  headers: Headers;
  data?: string;
}

export interface WebheadInstance {
  get(url: string, options?: WebheadRequestOptions): Promise<WebheadResponse>;
  post(url: string, options?: WebheadRequestOptions): Promise<WebheadResponse>;
  put(url: string, options?: WebheadRequestOptions): Promise<WebheadResponse>;
  patch(url: string, options?: WebheadRequestOptions): Promise<WebheadResponse>;
  delete(url: string, options?: WebheadRequestOptions): Promise<WebheadResponse>;
  head(url: string, options?: WebheadRequestOptions): Promise<WebheadResponse>;
  options(url: string, options?: WebheadRequestOptions): Promise<WebheadResponse>;
  text(): string;
  json(): any;
  $(): Promise<WebheadResponse>;
  submit(url: string, formData: object): Promise<WebheadResponse>;
}

export default function Webhead(options: WebheadOptions): WebheadInstance;
