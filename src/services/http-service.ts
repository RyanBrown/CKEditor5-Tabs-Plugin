// src/services/http-service.ts
import { SessionService } from './session-service';
import { IReadSource, IWriteSource } from '../data-sources/base-source/data-source';

export class HttpService {

  protected readonly _sampleMode: boolean = false;

  protected readonly _sessionSvc: SessionService;
  constructor(sessionSvc?: SessionService) {
    this._sessionSvc = sessionSvc ?? new SessionService();
  }

  protected get = async (dataSource: IReadSource, sessionToken: string, requestHeader: string): Promise<string> =>
    dataSource.load(sessionToken, requestHeader)
      .then(
        async response => await response.text(),
        error => this.handleError(error, true)
      );

  protected post = async (dataSource: IWriteSource, sessionToken: string, requestHeader: string, requestBody: Record<string, any>): Promise<string> =>
    dataSource.save(sessionToken, requestHeader, null, requestBody)
      .then(
        async response => await response.text(),
        error => this.handleError(error, true)
      );

  protected handleError = (error: Error, rethrow?: boolean): string => {
    console.log(error);
    if (rethrow) throw error;
    return error.message;
  }
}
