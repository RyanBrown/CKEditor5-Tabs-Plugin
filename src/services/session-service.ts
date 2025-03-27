// src/services/session-service.ts
import AlightRequest from "./alight-request";

export default class SessionService {

  private readonly apiUrlKey: string = 'apiUrl';
  private readonly dummyColleagueSessionTokenKey: string = 'dummyColleagueSessionToken';
  private readonly dummyRequestHeaderKey: string = 'dummyRequestHeader';

  private static instance: SessionService = null;
  private sessionMap: Map<string, string>;

  private constructor(sessionStorage?: Storage) {
    this.sessionMap = new Map<string, string>([
      [this.apiUrlKey, sessionStorage.getItem(this.apiUrlKey)!],
      [this.dummyColleagueSessionTokenKey, sessionStorage.getItem(this.dummyColleagueSessionTokenKey)!],
      [this.dummyRequestHeaderKey, sessionStorage.getItem(this.dummyRequestHeaderKey)!],
    ]);
  }

  public static create(sessionStorage: Storage): void {
    if (SessionService.instance === null) {
      SessionService.instance = new SessionService(sessionStorage);
    } else {
      throw new Error('Instance already created');
    }
  }

  public static getInstance(): SessionService {
    if (SessionService.instance === null) {
      throw new Error('Instance not yet created. Call create(Storage storage) first.');
    }
    return SessionService.instance;
  }

  public static getAlightRequest = (): AlightRequest => SessionService.getInstance().alightRequest;
  public get alightRequest(): AlightRequest {
    return new AlightRequest(this.apiUrl, this.requestHeader, this.sessionToken, this.clientId);
  }
  public get apiUrl(): string {
    return this.sessionMap.get(this.apiUrlKey)!;
  }
  public get sessionToken(): string {
    return this.sessionMap.get(this.dummyColleagueSessionTokenKey)!;
  }
  public get requestHeader(): string {
    return this.sessionMap.get(this.dummyRequestHeaderKey)!;
  }
  public get clientId(): string {
    return JSON.parse(this.sessionMap.get(this.dummyRequestHeaderKey))?.clientId;
  }

  // Added method to check if this is a Mockaroo API
  public get isMockarooApi(): boolean {
    return this.apiUrl.includes('mockaroo.com');
  }
}