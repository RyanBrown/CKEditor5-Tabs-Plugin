export class SessionService {

  public readonly _apiUrlKey: string = 'apiUrl';
  public readonly _dummyColleagueSessionToken: string = 'dummyColleagueSessionToken';
  public readonly _dummyRequestHeaderKey: string = 'dummyRequestHeader';

  private _sessionMap: Map<string, string> = new Map<string, string>([
    [this._apiUrlKey, sessionStorage.getItem(this._apiUrlKey)!],
    [this._dummyColleagueSessionToken, sessionStorage.getItem(this._dummyColleagueSessionToken)!],
    [this._dummyRequestHeaderKey, sessionStorage.getItem(this._dummyRequestHeaderKey)!],
  ]);

  public get apiUrl(): string {
    return this._sessionMap.get(this._apiUrlKey)!;
  }

  public get sessionToken(): string {
    return this._sessionMap.get(this._dummyColleagueSessionToken)!;
  }

  public get sessionHeader(): string {
    return this._sessionMap.get(this._dummyRequestHeaderKey)!;
  }

  public get clientId(): string {
    return this._sessionMap.get(this._dummyRequestHeaderKey))?.clientId;
  }
}
