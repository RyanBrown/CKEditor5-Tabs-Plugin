// src/services/http-service.ts
import { IReadSource, IWriteSource } from '../data-sources/base-source/data-source';
import AlightRequest from './alight-request';

export default class HttpService {

  public readonly alightRequest: AlightRequest;
  constructor(alightRequest: AlightRequest) {
    this.alightRequest = alightRequest;
  }

  public get = async (dataSource: IReadSource): Promise<string> =>
    dataSource.load(this.alightRequest._sessionToken, this.alightRequest._requestHeader)
      .then(
        async response => await response.text(),
        error => this.handleError(error, true)
      );

  public post = async (dataSource: IWriteSource, requestBody: Record<string, any>): Promise<string> =>
    dataSource.save(this.alightRequest._sessionToken, this.alightRequest._requestHeader, null, requestBody)
      .then(
        async response => await response.text(),
        error => this.handleError(error, true)
      );

  public handleError = (error: Error, rethrow?: boolean): string => {
    console.log(error);
    if (rethrow) throw error;
    return error.message;
  }
}
