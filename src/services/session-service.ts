export class SessionService {
  public readonly _apiUrlKey: string = 'apiUrl';
  public readonly _dummySessionTokenKey: string = 'sessionToken';
  public readonly _dummyRequestHeaderKey: string = 'sessionHeader';

  private sessionMap: Map<string, string> = new Map<string, string>([
    [this._apiUrlKey, sessionStorage.getItem(this._apiUrlKey)!],
    [this._dummySessionTokenKey, sessionStorage.getItem(this._dummySessionTokenKey)!],
    [this._dummyRequestHeaderKey, sessionStorage.getItem(this._dummyRequestHeaderKey)!],
  ]);

  public get apiUrl(): string {
    return localStorage.getItem(this._apiUrlKey) ?? '';
  }

  public get sessionToken(): string {
    return localStorage.getItem(this._dummySessionTokenKey) ?? '';
  }

  public get sessionHeader(): string {
    return localStorage.getItem(this._dummyRequestHeaderKey) ?? '';
  }

  public set clientId(): string {
    return JSON.parse(this.sessionMap.get(this._dummyRequestHeaderKey) ?? '');
  }
}
