// src/services/session-service.ts
import AlightRequest from "./alight-request";

export default class SessionService {

  private readonly apiUrlKey: string = 'apiUrl';
  private readonly dummyColleagueSessionTokenKey: string = 'dummyColleagueSessionToken';
  private readonly dummyRequestHeaderKey: string = 'dummyRequestHeader';
  private readonly clientIdKey: string = 'clientId'; // Added clientId key

  private static instance: SessionService = null;
  private sessionMap: Map<string, string>;

  private constructor(sessionStorage?: Storage) {
    this.sessionMap = new Map<string, string>([
      [this.apiUrlKey, sessionStorage.getItem(this.apiUrlKey) || ''],
      [this.dummyColleagueSessionTokenKey, sessionStorage.getItem(this.dummyColleagueSessionTokenKey) || ''],
      [this.dummyRequestHeaderKey, sessionStorage.getItem(this.dummyRequestHeaderKey) || ''],
      [this.clientIdKey, sessionStorage.getItem(this.clientIdKey) || 'default-client-id'],
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
    return this.sessionMap.get(this.apiUrlKey) || '';
  }
  public get sessionToken(): string {
    return this.sessionMap.get(this.dummyColleagueSessionTokenKey) || '';
  }
  public get requestHeader(): string {
    return this.sessionMap.get(this.dummyRequestHeaderKey) || '';
  }
  public get clientId(): string {
    return this.sessionMap.get(this.clientIdKey) || 'default-client-id';
  }

  // Set clientId method
  public setClientId(value: string): void {
    this.sessionMap.set(this.clientIdKey, value);
  }

  // Check if this is a Mockaroo API
  public get isMockarooApi(): boolean {
    return this.apiUrl.includes('mockaroo.com');
  }

  // Get Mockaroo API key if available
  public get mockarooApiKey(): string {
    if (!this.isMockarooApi) return null;

    const apiKeyMatch = this.apiUrl.match(/key=([^&]+)/);
    return apiKeyMatch ? apiKeyMatch[1] : null;
  }
}