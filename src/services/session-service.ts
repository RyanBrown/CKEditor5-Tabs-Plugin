export class SessionService {

  public readonly _apiUrlKey: string = 'apiUrl';
  public readonly _dummyColleagueSessionTokenKey: string = 'dummyColleagueSessionToken';
  public readonly _dummyRequestHeaderKey: string = 'dummyRequestHeader';

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
    return JSON.parse(this._sessionMap.get(this._dummyRequestHeaderKey))?.clientId;
  }
}
