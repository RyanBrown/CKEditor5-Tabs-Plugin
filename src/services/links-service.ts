import predefinedLinkSampleData from './../data/predefined-test-data.json';
import { DataSourceLinks } from '../data-sources/custom-source/data-source-links';
import { HttpService } from './http-service';
import { IReadSource } from '../data-sources/base-source/data-source';
import { PredefinedLink } from '../plugins/alight-predefined-link-plugin/modal-content/predefined-link-modal-types';

export class LinksService extends HttpService {
  public getPredefinedLinks = async (): Promise<PredefinedLink[]> => {

    if (this._sampleMode)
      return Promise.resolve(predefinedLinkSampleData.predefinedLinksDetails as PredefinedLink[]);

    let dataSource: IReadSource = new DataSourceLinks(this._sessionSvc.apiUrl);
    return await this.get(dataSource, this._sessionSvc.sessionToken, this._sessionSvc.sessionHeader)
      .then(response => JSON.parse(response).predefinedLinksDetails as PredefinedLink[]);
  }
}
