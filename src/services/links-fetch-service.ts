// src/services/links-fetch-service.ts
import categorySampleData from "./../data/category-sample-data.json";
import existingDocSampleData from "./../data/existing-document-link-sample-data.json";
import predefinedLinkSampleData from "./../data/predefined-link-sample-data.json";
import { PredefinedLink } from "../plugins/alight-predefined-link-plugin/ui/linkmodal-modal-types";
import HttpService from "./http-service";
import { DataSourceLinks } from "../data-sources/custom-source/data-source-links";
import { DocumentLink } from "../plugins/alight-existing-document-link-plugin/ui/linkmodal-modal-types";
import { IReadSource, IWriteSource } from "../data-sources/base-source/data-source";
import { DataSourceDocs, IReadSourceDocs } from "../data-sources/custom-source/data-source-docs";

export default class LinksFetchService extends HttpService {
  private readonly _categorySampleMode: boolean = true;
  private readonly _documentLinksSampleMode: boolean = false;
  private readonly _predefinedLinksSampleMode: boolean = false;

  public fetchPredefinedLinks = async (): Promise<PredefinedLink[]> => {

    if (this._predefinedLinksSampleMode)
      return Promise.resolve(predefinedLinkSampleData.predefinedLinksDetails as PredefinedLink[]);

    let dataSource: IReadSource = new DataSourceLinks(this.alightRequest._apiUrl);
    return await this.get(dataSource)
      .then(response => JSON.parse(response).predefinedLinksDetails as PredefinedLink[]
        // error => console.error(error) // TODO switch this to return new Promise
      );
  }

  public fetchDocumentLinks = (): Promise<DocumentLink[]> => {
    if (this._documentLinksSampleMode)
      return Promise.resolve(existingDocSampleData.documentList as DocumentLink[]);

    let dataSource: IReadSource = new DataSourceDocs(this.alightRequest._apiUrl, this.alightRequest._clientId);
    return this.get(dataSource)
      .then(response => JSON.parse(response).documentList as DocumentLink[]);
  }

  public fetchCategories = (): Promise<string[]> => {
    if (this._categorySampleMode)
      return Promise.resolve(categorySampleData.categoryList as string[]);

    let dataSource: IReadSourceDocs = new DataSourceDocs(this.alightRequest._apiUrl, this.alightRequest._clientId);
    return this.get(dataSource.dataSourceCategory)
      .then(response => JSON.parse(response).categoryList as string[]);
  }

  public saveDocument = (document: Record<string, any>): Promise<string> => {
    let dataSource: IWriteSource = new DataSourceDocs(this.alightRequest._apiUrl, this.alightRequest._clientId);
    return this.post(dataSource, document);
  }
}
