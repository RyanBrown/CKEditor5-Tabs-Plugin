import { DataSourceGet } from '../base-source/data-source-get';
import { DataSourcePost } from '../base-source/data-source-post';
import { DataSource } from '../base-source/data-source';
import { IReadSource, IWriteSource } from '../base-source/data-source';

class DataSourceDocsPaths extends DataSource {
  protected static getPath = `dummy-path/content/documentPath`;
  protected static postPath = `dummy-path/document/files`;
}

class DataSourceCategories extends DataSourceDocsPaths implements IReadSource {

  private static folderPath = `categories-path/Categories`;

  constructor(host: string, clientId: string) {
    super(
      new DataSourceGet(host, DataSourceCategories.getPath, `folderPath=${DataSourceCategories.folderPath}&clientId=${clientId}`)
    );
  }
}

export interface IReadSourceDocs extends IReadSource {
  get dataSourceCategory(): IReadSource;
}

export class DataSourceDocs extends DataSourceDocPaths implements IReadSourceDocs, IWriteSource {

  private static folderPath = `folder-path/UploadedDocs`;

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