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
  private readonly _documentLinkSampleMode: boolean = false;
  private readonly predefinedLinkSampleMode: boolean = false;

  public fetchPredefinedLinks = async (): Promise<PredefinedLink[]> => {
    if (this._predefinedLinkSampleMode)
      return Promise.resolve(predefinedLinkSampleData.predefinedLinksDetails as PredefinedLink[]);

    let dataSource: IReadSource = new DataSourceLinks(this.alightRequest._apiUrl);
    return this.get(dataSource)
      .then(
        response => JSON.parse(response) as PredefinedLink[],
        // error => { console.error(error); return []; }
      );
  }

  public fetchDocumentLinks = async (): Promise<DocumentLink[]> => {

    if (this._documentLinkSampleMode)
      return Promise.resolve(existingDocSampleData.documentLinks as DocumentLink[]);

    let dataSource: IReadSource = new DataSourceDocs(this.alightRequest._apiUrl);
    return this.get(dataSource);
  }
}
