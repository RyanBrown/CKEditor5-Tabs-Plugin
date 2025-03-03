import { Category } from './../plugins/alight-new-document-link-plugin/modal-content/mock/categories';
import existingDocSampleData from '../data/existing-doc-sample-data.json';
import categorySampleData from '../plugins/alight-new-document-link-plugin/modal-content/mock/categories';
import { DocumentLink } from './../plugins/alight-predefined-link-plugin/modal-content/predefined-link-modal-types';
import { HttpService } from '../services/http-service';
import { IReadSource, IWriteSource } from '../data-sources/base-source/data-source';

export class DocService {

  private readonly _categorySampleModalData: boolean = true;

  public getDocumentLinks = async (): Promise<DocumentLink[]> => {
    if (this._sampleMode)
      return Promise.resolve(existingDocSampleData.documentList as DocumentLink[]);

    let dataSource: IReadSource = new DataSourceDocs(this.sessionSvc.apiUrl, this.sessionSvc.clientId);
    return await this.get(dataSource, this.sessionSvc.sessionToken, this.sessionSvc.sessionHeader)
      .then((response: string) => JSON.parse(response).documentList as DocumentLink[]);
  }

  public getCategories = async (): Promise<DocumentLink[]> => {

    if (this._categorySampleMode)
      return Promise.resolve(categorySampleData.categoryList as string[]);

    let dataSource: IReadSourceDocs = new DataSourceDocs(this.sessionSvc.apiUrl, this.sessionSvc.clientId);
    return await this.get(dataSource, this.sessionSvc.sessionToken, this.sessionSvc.sessionHeader)
      .then((response: string) => JSON.parse(response).documentList as DocumentLink[]);
  }

  public saveDocument = async (document: Record<string, any>): Promise<string> => {

    let dataSource: IWriteSource = new DataSourceDocs(this.sessionSvc.apiUrl, this.sessionSvc.clientId);
    return await this.post(dataSource, this.sessionSvc.sessionToken, this.sessionSvc.sessionHeader, document)
  }
}
