// src/services/session-service.ts
import AlightRequest from "./alight-request";

export default class SessionService {

  private readonly apiUrlKey: string = 'apiUrl';
  private readonly dummyColleagueSessionTokenKey: string = 'dummyColleagueSessionToken';
  private readonly dummyRequestHeaderKey: string = 'dummyRequestHeader';

  private _sessionMap: Map<string, string> = new Map<string, string>([
    [this.apiUrlKey, sessionStorage.getItem(this.apiUrlKey)!],
    [this.dummyColleagueSessionTokenKey, sessionStorage.getItem(this.dummyColleagueSessionTokenKey)!],
    [this.dummyRequestHeaderKey, sessionStorage.getItem(this.dummyRequestHeaderKey)!],
  ]);
  public get apiUrl(): string {
    return this._sessionMap.get(this.apiUrlKey)!;
  }
  public get sessionToken(): string {
    return this._sessionMap.get(this.dummyColleagueSessionTokenKey)!;
  }
  public get requestHeader(): string {
    return this._sessionMap.get(this.dummyRequestHeaderKey)!;
  }
  public get clientId(): string {
    try {
      const headerObj = JSON.parse(this._sessionMap.get(this.dummyRequestHeaderKey) || '{}');
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