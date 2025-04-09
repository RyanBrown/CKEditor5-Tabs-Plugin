// src/data-sources/base-source/data-source.ts
export interface IDataSource {
  get host(): string;
  set host(value: string);

  get path();
  set path(path: string);
}

export abstract class DataSource implements IDataSource {
  private _host: string;
  get host(): string { return this._host; }
  set host(value: string) { this._host = value; }

  abstract get path();
  abstract set path(path: string);

  constructor(host: string) {
    this._host = host;
  }
}

export interface IWriteSource {
  save(sessionToken: string, requestHeader: string, contentType?: string, requestBody?: Record<string, any>): Promise<Response>;
}

export interface IReadSource {
  load(sessionToken: string, requestHeader: string, contentType?: string): Promise<Response>;
}
