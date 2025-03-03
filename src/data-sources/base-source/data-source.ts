export interface IDataSource {
  get host(): string;
  get host(value: string);

  get path(): string;
  get path(value: string);
}

export abstract class DataSource implements IDataSource {
  private _host: string;
  get host(): string { return this._host; }
  set host(value: string) { this._host = value; }

  abstract get path(): string;
  abstract set path(value: string);

  constructor(host: string) {
    this._host = host;
  }
}

export interface IWriteSource {
  save(sessionToken: string, requestHeader: string, contentType?: string, requestBody?: string): Promise<Response>;
}

export interface IReadSource {
  load(sessionToken: string, requestHeader: string, contentType?: string): Promise<Response>;
}

