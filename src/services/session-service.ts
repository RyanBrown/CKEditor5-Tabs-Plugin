// src/services/session-service.ts
export class SessionService {
  private readonly _apiUrlKey: string = 'apiUrl';
  private readonly _dummyColleagueSessionTokenKey: string = 'dummyColleagueSessionToken';
  private readonly _dummyRequestHeaderKey: string = 'dummyRequestHeader';

  private _sessionMap: Map<string, string> = new Map<string, string>([
    [this._apiUrlKey, sessionStorage.getItem(this._apiUrlKey)!],
    [this._dummyColleagueSessionTokenKey, sessionStorage.getItem(this._dummyColleagueSessionTokenKey)!],
    [this._dummyRequestHeaderKey, sessionStorage.getItem(this._dummyRequestHeaderKey)!],
  ]);

  public get apiUrl(): string {
    return this._sessionMap.get(this._apiUrlKey)!;
  }

  public get sessionToken(): string {
    return this._sessionMap.get(this._dummyColleagueSessionTokenKey)!;
  }

  public get requestHeader(): string {
    return this._sessionMap.get(this._dummyRequestHeaderKey)!;
  }

  public get clientId(): string {
    try {
      const headerObj = JSON.parse(this._sessionMap.get(this._dummyRequestHeaderKey) || '{}');
      return headerObj?.clientId;
    } catch (e) {
      return '';
    }
  }

  // Added method to check if this is a Mockaroo API
  public get isMockarooApi(): boolean {
    return this.apiUrl.includes('mockaroo.com');
  }
}