import existingDocSampleData from './../data/existing-document-test-data.json';
import categorySampleData from '../plugins/alight-new-document-link-plugin/modal-content/json/category-sample-data.json';
import { DataSourceDocs, IReadSourceDocs } from '../data-sources/custom-source/data-source-docs';
import { DocumentLink } from '../plugins/alight-predefined-link-plugin/modal-content/predefined-link-modal-types';
import { HttpService } from "./http-service";
import { IReadSource, IWriteSource } from "../data-sources/base-source/data-source";

export class DocsService extends HttpService {

  private readonly _categorySampleMode: boolean = true;

  public getDocumentLinks = async (): Promise<DocumentLink[]> => {

    if (this._sampleMode)
      return Promise.resolve(existingDocSampleData.documentList as unknown as DocumentLink[]);

    let dataSource: IReadSource = new DataSourceDocs(this._sessionSvc.apiUrl, this._sessionSvc.clientId);
    return await this.get(dataSource, this._sessionSvc.sessionToken, this._sessionSvc.requestHeader)
      .then(response => JSON.parse(response).documentList as DocumentLink[]);
  }

  public getCategories = async (): Promise<string[]> => {

    if (this._categorySampleMode)
      return Promise.resolve(categorySampleData.categoryList as string[]);

    let dataSource: IReadSourceDocs = new DataSourceDocs(this._sessionSvc.apiUrl, this._sessionSvc.clientId);
    return await this.get(dataSource.dataSourceCategory, this._sessionSvc.sessionToken, this._sessionSvc.requestHeader)
      .then(response => JSON.parse(response).categoryList as string[]);
  }

  public saveDocument = async (document: Record<string, any>): Promise<string> => {

    let dataSource: IWriteSource = new DataSourceDocs(this._sessionSvc.apiUrl, this._sessionSvc.clientId);
    return await this.post(dataSource, this._sessionSvc.sessionToken, this._sessionSvc.requestHeader, document);
  }
}
