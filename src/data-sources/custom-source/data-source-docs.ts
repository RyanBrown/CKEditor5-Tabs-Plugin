import { DataSourceGet } from '../base-source/data-source-get';
import { DataSourcePost } from '../base-source/data-source-post';
import { DataSource } from '../base-source/data-source';
import { IReadSource, IWriteSource } from '../base-source/data-source';

class DataSourceDocsPaths extends DataSource {
  protected static getPath = `my-path`;
  protected static postPath = `my-path`;
}

class DataSourceCategories extends DataSourceDocsPaths implements IReadSource {

  private static folderPath = `categories-path`;

  constructor(host: string, clientId: string) {
    super(new DataSourceGet(host, DataSourceCategories.getPath, `folderPath=${DataSourceCategories.folderPath}&clientId=${clientId}`));
  }
}

export interface IReadSource extends IReadSource {
  get dataSourceCategory(): IReadSource;
}

export class DataSourceDocs extends DataSourcePaths implements IReadSourceDocs, IWriteSource {

  private static folderPath = `folder-path`;

  private _dataSourceCategories: DataSourceCategories;
  public get dataSourceCategory(): IReadSource { return this._dataSourceCategories; }

  constructor(host: string, clientId: string) {
    super(
      new DataSourceGet(host, DataSourceDocs.getPath, `folderPath=${DataSourceDocs.folderPath}&clientId=${clientId}`),
      new DataSourcePost(host, DataSourceDocs.postPath)
    );
    this._dataSourceCategories = new DataSourceCategories(host, clientId);
  }
}

