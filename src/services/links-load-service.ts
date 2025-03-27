import { PredefinedLink } from '../plugins/alight-predefined-link-plugin/ui/linkmodal-modal-types';
import { DocumentLink } from '../plugins/alight-existing-link-plugin/ui/linkmodal-modal-types';
import DataLoadRunner from './alight-common/data-loader';
import SessionService from './session-service';
import LinkFetchService from './link-fetch-service';

export default class LinksLoadService {

  private fetchService: LinkFetchService = new LinkFetchService(SessionService.getAlightRequest());

  public loadCategories = async (): Promise<string[]> =>
    await DataLoadRunner.run(this.fetchService.fetchCategories());

  public loadDocumentLinks = async (): Promise<string[]> =>
    await DataLoadRunner.run(this.fetchService.fetchDocumentLinks());

  public loadPredefinedLinks = async (): Promise<string[]> =>
    await DataLoadRunner.run(this.fetchService.fetchPredefinedLinks());
}