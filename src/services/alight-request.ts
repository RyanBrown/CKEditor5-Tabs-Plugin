// src/services/alight-request.ts

export default class AlightRequest {
  public _apiUrl: string;
  public _requestHeader: string;
  public _sessionToken: string;
  public _clientId: string;

  constructor(apiUrl: string, requestHeader: string, sessionToken: string, clientId: string) {
    this._apiUrl = apiUrl;
    this._requestHeader = requestHeader;
    this._sessionToken = sessionToken;
    this._clientId = clientId;
  }

  public getApiUrl(): string { return this._apiUrl; }
  public setApiUrl(value: string) { this._apiUrl = value; }

  public getRequestHeader(): string { return this._requestHeader; }
  public setRequestHeader(value: string) { this._requestHeader = value; }

  public getSessionToken(): string { return this._sessionToken; }
  public setSessionToken(value: string) { this._sessionToken = value; }

  public getClientId(): string { return this._clientId; }
  public setClientId(value: string) { this._clientId = value; }
}
