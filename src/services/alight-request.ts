// src/services/alight-request.ts

export default class AlightRequest {
  public _apiUrl: string;
  public _requestHeader: string;
  public _sessionToken: string;
  public _clientId: string;

  private constructor(apiUrl: string, requestHeader: string, sessionToken: string, clientId: string) {
    this._apiUrl = apiUrl;
    this._requestHeader = requestHeader;
    this._sessionToken = sessionToken;
    this._clientId = clientId;
  }

  public get getApiUrl(): string { return this._apiUrl; }
  public set setApiUrl(value: string) { this._apiUrl = value; }

  public get getRequestHeader(): string { return this._requestHeader; }
  public set setRequestHeader(value: string) { this._requestHeader = value; }

  public get getSessionToken(): string { return this._sessionToken; }
  public set setSessionToken(value: string) { this._sessionToken = value; }

  public get getClientId(): string { return this._clientId; }
  public set setClientId(value: string) { this._clientId = value; }
}
