// src/services/links-service.ts
import predefinedLinkSampleData from './../data/predefined-link-sample-data.json';
import { DataSourceLinks } from '../data-sources/custom-source/data-source-links';
import { PredefinedLink } from './../plugins/alight-predefined-link-plugin/ui/linkmodal-modal-types';
import { HttpService } from './http-service';
import { IReadSource } from '../data-sources/base-source/data-source';

export class LinksService extends HttpService {
  public getPredefinedLinks = async (): Promise<PredefinedLink[]> => {
    if (this._sampleMode)
      return Promise.resolve(predefinedLinkSampleData.predefinedLinksDetails as PredefinedLink[]);

    let dataSource: IReadSource = new DataSourceLinks(this._sessionSvc.apiUrl);

    const requestHeader = this._sessionSvc.isMockarooApi ?
      this._sessionSvc.sessionToken : // For Mockaroo, pass the API key directly
      this._sessionSvc.requestHeader; // For other APIs, use the standard header

    return await this.get(dataSource, this._sessionSvc.sessionToken, requestHeader)
      .then(response => {
        try {
          // Try to parse the response as JSON
          const parsed = JSON.parse(response);

          // Check if the response has predefinedLinksDetails property
          if (parsed.predefinedLinksDetails) {
            return parsed.predefinedLinksDetails as PredefinedLink[];
          }
          // If the response is an array directly, return it
          else if (Array.isArray(parsed)) {
            return parsed as PredefinedLink[];
          }
          // Otherwise, wrap the response in an array
          else {
            console.warn('Unexpected response format from API');
            return [parsed] as PredefinedLink[];
          }
        } catch (error) {
          console.error('Error parsing API response:', error);
          return [];
        }
      });
  }
}