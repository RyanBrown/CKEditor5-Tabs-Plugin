// src/services/links-load-service.ts
import { PredefinedLink } from '../plugins/alight-predefined-link-plugin/ui/linkmodal-modal-types';
import { DocumentLink } from '../plugins/alight-existing-document-link-plugin/ui/linkmodal-modal-types';
import DataLoaderRunner from '../alight-common/data-loader';
import SessionService from './session-service';
import LinksFetchService from './links-fetch-service';

export default class LinksLoadService {
  private fetchService: LinksFetchService = new LinksFetchService(SessionService.getAlightRequest());

  public loadCategories = async (): Promise<string[]> =>
    await DataLoaderRunner.run(this.fetchService.fetchCategories);

  public loadDocumentLinks = async (): Promise<DocumentLink[]> =>
    await DataLoaderRunner.run(this.fetchService.fetchDocumentLinks);

  public loadPredefinedLinks = async (): Promise<PredefinedLink[]> =>
    await DataLoaderRunner.run(this.fetchService.fetchPredefinedLinks);
}
