// src/data-sources/custom-source/data-source-docs.ts
import { DataSourceGet } from '../base-source/data-source-get';
import { DataSourcePost } from '../base-source/data-source-post';
import { DataSources } from './data-sources';
import { IReadSource, IWriteSource } from '../base-source/data-source';

class DataSourceDocsPaths extends DataSources {
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

export class DataSourceDocs extends DataSourceDocsPaths implements IReadSourceDocs, IWriteSource {

  private static folderPath = `folder-path/Uploaded_Docs`;

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
