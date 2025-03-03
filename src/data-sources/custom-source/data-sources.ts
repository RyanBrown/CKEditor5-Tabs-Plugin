import { DataSourceGet } from '../base-source/data-source-get';
import { DataSourcePost } from '../base-source/data-source-post';
import { IReadSource, IWriteSource } from '../base-source/data-source';

export class DataSources implements IReadSource, IWriteSource {
  private _get: DataSourceGet;
  private _post: DataSourcePost;

  constructor(get: DataSourceGet, post: DataSourcePost) {
    this._get = get;
    this._post = post;
  }

  public load = async (sessionToken: string, requestHeader: string, contentType?: string): Promise<Response> =>
    await this._get.request(sessionToken, requestHeader, contentType);

  public save = async (sessionToken: string, requestHeader: string, contentType?: string, requestBody?: string): Promise<Response> =>
    await this._post.request(sessionToken, requestHeader, contentType, requestBody);
}
