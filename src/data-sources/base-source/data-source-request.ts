// src/data-sources/base-source/data-source-request.ts
import { DataSource } from "./data-source";
import { HttpRequestMethod } from "./http-request-method";

export interface IDataSourceRequest {

  get requestMethod(): HttpRequestMethod; // GET, POST, PUT, etc.
  get queryParams(): string;
  set queryParams(value: string);
  request(sessionToken: string, requestHeader: string, contentType?: string): Promise<Response>;
}

export abstract class DataSourceRequest extends DataSource implements IDataSourceRequest {

  public abstract get requestMethod(): HttpRequestMethod;

  private _queryParams: string;
  get queryParams(): string { return this._queryParams; }
  set queryParams(value: string) { this._queryParams = value; }

  constructor(host: string, queryParams?: string) {
    super(host);
    this.queryParams = queryParams;
  }

  public request = async (sessionToken: string, requestHeader: string, contentType?: string, requestBody?: Record<string, any>): Promise<Response> => {
    try {
      if (sessionToken == null || requestHeader == null)
        throw new Error("Must provide both a dummyColleagueSessionToken and dummyRequestHeader.");

      let url = `${this.host}/${this.path}${this.queryParams?.length > 0 ? `?${this.queryParams}` : ''}`;
      const options: RequestInit = {
        method: this.requestMethod,
        headers: {
          'Content-Type': contentType || 'application/json',
          'dummyColleagueSessionToken': sessionToken,
          'alightRequestHeader': requestHeader
        },
      };

      if (this.requestMethod == HttpRequestMethod.POST && requestBody) options.body = JSON.stringify(requestBody);
      return await fetch(url, options);
    } catch (error) {
      console.error(`DataSource.request -> request failed: <tag>.`, error);
      throw error;
    }
  }
}
