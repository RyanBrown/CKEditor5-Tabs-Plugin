import { DataSourceGet } from '../base-source/data-source-get';
import { DataSourcePost } from '../base-source/data-source-post';
import { IReadSource, IWriteSource } from '../base-source/data-source';

export abstract class DataSources implements IReadSource, IWriteSource {
  protected _get: DataSourceGet;
  protected _post: DataSourcePost;

  constructor(get: DataSourceGet, post: DataSourcePost) {
    this._get = get;
    this._post = post;
  }

  public load = async (sessionToken: string, requestHeader: string, contentType?: string): Promise<Response> =>
    await this._get.request(sessionToken, requestHeader, contentType);

  public save = async (sessionToken: string, requestHeader: string, contentType?: string, requestBody?: Record<string, any>): Promise<Response> =>
    await this._post.request(sessionToken, requestHeader, contentType, requestBody);
}
