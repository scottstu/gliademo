import axios, { AxiosRequestConfig, Method } from 'axios';

export interface HttpRequestOptions {
  url: string;
  method: Method;
  headers?: { [key: string]: string };
  data?: any;
  params?: any;
}

export class HttpRequest {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  makeRequest(options: HttpRequestOptions) {
    const axiosConfig: AxiosRequestConfig = {
      baseURL: this.baseUrl,
      url: options.url,
      method: options.method,
    };

    if (options.data) axiosConfig.data = options.data;
    if (options.params) axiosConfig.params = options.params;
    if (options.headers) axiosConfig.headers = options.headers;

    return axios(axiosConfig);
  }
}
