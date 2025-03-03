import { DataSourceRequest, IDataSourceRequest } from './data-source-request';
import { HttpRequestMethod } from './http-request-method';

export class DataSourcePost extends DataSourceRequest implements IDataSourceRequest {
  override get requestMethod(): HttpRequestMethod { return HttpRequestMethod.POST; }

  private _path: string;
  override get path(): string { return this._path; }
  override set path(value: string) { this._path = value; }

  constructor(host: string, path: string, body: string) {
    super(host);
    this.path = path;
  }
}