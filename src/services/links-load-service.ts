// src/services/links-load-service.ts
import { PredefinedLink } from '../plugins/alight-predefined-link-plugin/ui/linkmodal-modal-types';
import { DocumentLink, DocumentResponse } from '../plugins/alight-existing-document-link-plugin/ui/linkmodal-modal-types';
import DataLoaderRunner from '../alight-common/data-loader';
import SessionService from './session-service';
import LinksFetchService from './links-fetch-service';

export default class LinksLoadService {
  private fetchService: LinksFetchService = new LinksFetchService(SessionService.getAlightRequest());

  public loadCategories = async (): Promise<string[]> =>
    await DataLoaderRunner.run(this.fetchService.fetchCategories);

  public loadDocumentLinks = async (): Promise<DocumentLink[]> => {
    try {
      const data = await DataLoaderRunner.run(this.fetchService.fetchDocumentLinks);

      // Log the structure of what we received
      console.log('LinksLoadService received document links:',
        Array.isArray(data) ? data.length : 'non-array data');

      // Process DocumentResponse structure if needed
      if (Array.isArray(data) && data.length > 0) {
        const firstItem = data[0] as any;
        if (firstItem &&
          typeof firstItem === 'object' &&
          'documentList' in firstItem &&
          Array.isArray(firstItem.documentList)) {
          console.log('Found DocumentResponse structure, extracting documentList with length:',
            firstItem.documentList.length);
          return firstItem.documentList as DocumentLink[];
        }
      }

      // Make sure to explicitly cast to DocumentLink[]
      return data as DocumentLink[];
    } catch (error) {
      console.error('Error in loadDocumentLinks:', error);
      return [];
    }
  }

  public loadPredefinedLinks = async (): Promise<PredefinedLink[]> =>
    await DataLoaderRunner.run(this.fetchService.fetchPredefinedLinks);
}
