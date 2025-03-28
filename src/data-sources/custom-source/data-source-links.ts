// src/data-sources/custom-source/data-source-links.ts
import { DataSourceGet } from '../base-source/data-source-get';
import { DataSources } from './data-sources';
import { IReadSource } from '../base-source/data-source';

export class DataSourceLinks extends DataSources implements IReadSource {

  private static httpGetPath = `dummy-path/common/getPreferredPages`;

  constructor(host: string) {
    super(
      new DataSourceGet(host, DataSourceLinks.httpGetPath)
    );
  }
}
