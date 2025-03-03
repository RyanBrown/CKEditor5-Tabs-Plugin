import { DataSource } from './data-source';
import { HttpRequestMethod } from './http-request-method';

export interface IDataSourceRequest {
  get requestMethod(): HttpRequestMethod;
  get queryParams(): string;
  set queryParams(value: string);
  request(sessionToken: string, requestHeader: string, contentType?: string): Promise<Response>;
}

export abstract class DataSourceRequest implements IDataSourceRequest {
  public abstract get requestMethod(): HttpRequestMethod;

  private _queryParams: string;
  get queryParams(): string { return this._queryParams; }
  set queryParams(value: string) { this._queryParams = value; }

  constructor(host: string, queryParams?: string) {
    super(host);
    this._queryParams = queryParams;
  }

  public request(sessionToken: string, requestHeader: string, contentType?: string, requestBody?: string): Promise<Response> {
    try {
      if (sessionToken === null || sessionToken === undefined) {
        throw new Error('Must provide both a dummySessionToken token and dummyRequestHeader');
      }
      let url = `${this.host}/${this.path}${this.queryParams ? `?${this.queryParams}` : ''}`;
      const options: RequestInit = {
        method: this.requestMethod,
        headers: {
          'Content-Type': contentType ?? 'application/json',
          'dummySessionToken': sessionToken,
          'dummyRequestHeader': requestHeader,
        },
      }
      if (this.requestMethod === HttpRequestMethod.POST && requestBody) options.body = JSON.stringify(requestBody);
      return await fetch(url, options);
    } catch (error) {
      console.error(`DataSource.request -> request failed: <tag>.` error);
    }
  }
}
