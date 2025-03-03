import { DataSourceGet } from '../base-source/data-source-get';
import { DataSources } from './data-sources';
import { IReadSource } from '../base-source/data-source';

class DataSourceLinks extends DataSources implements IReadSource {

  private static httpGetPath = `links-path`;

  constructor(host: string) {
    super(new DataSourceGet(host, DataSourceLinks.httpGetPath));
  }
}