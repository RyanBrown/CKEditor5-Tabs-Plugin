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
import SessionService from "./session-service";

export default class LinksFetchService extends HttpService {

  private readonly _categorySampleMode: boolean = true;
  private readonly _documentLinksSampleMode: boolean = false;
  private readonly _predefinedLinksSampleMode: boolean = false;

  // Mockaroo API endpoints
  private readonly MOCKAROO_PREDEFINED_LINKS_ENDPOINT = "predefined_link.json";
  private readonly MOCKAROO_DOCUMENT_LINKS_ENDPOINT = "existing_document.json";
  private readonly MOCKAROO_FALLBACK_KEY = "b3c0df80"; // Default fallback key

  public fetchPredefinedLinks = async (): Promise<PredefinedLink[]> => {
    // If sample mode is enabled, return sample data
    if (this._predefinedLinksSampleMode) {
      console.log("Using predefined links sample data");
      return Promise.resolve(predefinedLinkSampleData.predefinedLinksDetails as PredefinedLink[]);
    }

    // Check if using Mockaroo API
    if (SessionService.getInstance().isMockarooApi) {
      console.log("Fetching predefined links from Mockaroo");
      try {
        // Extract the API key from the existing URL if possible
        const apiKey = this.extractMockarooApiKey();

        // Use a direct, clean URL to the Mockaroo endpoint
        const mockarooUrl = `https://my.api.mockaroo.com/${this.MOCKAROO_PREDEFINED_LINKS_ENDPOINT}?key=${apiKey}`;
        console.log('Fetching predefined links from Mockaroo URL:', mockarooUrl);

        const response = await fetch(mockarooUrl);

        if (!response.ok) {
          console.error(`Mockaroo API returned status ${response.status}`);
          throw new Error(`Mockaroo API returned ${response.status}`);
        }

        const data = await response.json();
        console.log('Received predefined links data from Mockaroo:', data);

        // Transform the data to match PredefinedLink[] format if needed
        const links = Array.isArray(data) ? data : (data.predefinedLinksDetails || []);
        return links as PredefinedLink[];
      } catch (error) {
        console.error('Error fetching predefined links from Mockaroo:', error);
        // Fall back to sample data
        console.log('Falling back to predefined links sample data');
        return predefinedLinkSampleData.predefinedLinksDetails as PredefinedLink[];
      }
    } else {
      // Regular API call using DataSourceLinks
      console.log("Fetching predefined links from regular API");
      let dataSource: IReadSource = new DataSourceLinks(this.alightRequest._apiUrl);
      try {
        const response = await this.get(dataSource);
        const parsedResponse = JSON.parse(response);
        return parsedResponse.predefinedLinksDetails as PredefinedLink[];
      } catch (error) {
        console.error('Error fetching predefined links from API:', error);
        return [];
      }
    }
  }

  public fetchDocumentLinks = async (): Promise<DocumentLink[]> => {
    // If sample mode is enabled, return sample data
    if (this._documentLinksSampleMode) {
      console.log("Using document links sample data");
      return Promise.resolve(existingDocSampleData.documentList as DocumentLink[]);
    }

    // Check if using Mockaroo API
    if (SessionService.getInstance().isMockarooApi) {
      console.log("Fetching document links from Mockaroo");
      try {
        // Extract the API key from the existing URL if possible
        const apiKey = this.extractMockarooApiKey();

        // Use a direct, clean URL to the Mockaroo endpoint
        const mockarooUrl = `https://my.api.mockaroo.com/${this.MOCKAROO_DOCUMENT_LINKS_ENDPOINT}?key=${apiKey}`;
        console.log('Fetching document links from Mockaroo URL:', mockarooUrl);

        const response = await fetch(mockarooUrl);

        if (!response.ok) {
          console.error(`Mockaroo API returned status ${response.status}`);
          throw new Error(`Mockaroo API returned ${response.status}`);
        }

        const data = await response.json();
        console.log('Received document links data from Mockaroo:', data);

        // Transform the data to match DocumentLink[] format if needed
        const links = Array.isArray(data) ? data : (data.documentList || []);
        return links as DocumentLink[];
      } catch (error) {
        console.error('Error fetching document links from Mockaroo:', error);
        // Fall back to sample data
        console.log('Falling back to document links sample data');
        return existingDocSampleData.documentList as DocumentLink[];
      }
    } else {
      // Regular API call using DataSourceDocs
      console.log("Fetching document links from regular API");
      let dataSource: IReadSource = new DataSourceDocs(this.alightRequest._apiUrl, this.alightRequest._clientId);
      try {
        const response = await this.get(dataSource);
        const parsedResponse = JSON.parse(response);
        return parsedResponse.documentList as DocumentLink[];
      } catch (error) {
        console.error('Error fetching document links from API:', error);
        return [];
      }
    }
  }

  public fetchCategories = async (): Promise<string[]> => {
    // If sample mode is enabled, return sample data
    if (this._categorySampleMode) {
      console.log("Using categories sample data");
      return Promise.resolve(categorySampleData.categoryList as string[]);
    }

    // Check if using Mockaroo API
    if (SessionService.getInstance().isMockarooApi) {
      console.log("Would fetch categories from Mockaroo, but using sample data for now");
      return Promise.resolve(categorySampleData.categoryList as string[]);
    } else {
      // Regular API call
      console.log("Fetching categories from regular API");
      let dataSource: IReadSourceDocs = new DataSourceDocs(this.alightRequest._apiUrl, this.alightRequest._clientId);
      try {
        const response = await this.get(dataSource.dataSourceCategory);
        const parsedResponse = JSON.parse(response);
        return parsedResponse.categoryList as string[];
      } catch (error) {
        console.error('Error fetching categories from API:', error);
        return [];
      }
    }
  }

  public saveDocument = async (document: Record<string, any>): Promise<string> => {
    console.log("Saving document:", document);
    let dataSource: IWriteSource = new DataSourceDocs(this.alightRequest._apiUrl, this.alightRequest._clientId);
    try {
      return await this.post(dataSource, document);
    } catch (error) {
      console.error('Error saving document:', error);
      return JSON.stringify({ success: false, error: error.message });
    }
  }

  // Helper method to extract API key from URL
  private extractMockarooApiKey = (): string => {
    const apiUrl = this.alightRequest._apiUrl;
    const apiKeyMatch = apiUrl.match(/key=([^&]+)/);
    return apiKeyMatch ? apiKeyMatch[1] : this.MOCKAROO_FALLBACK_KEY;
  }
}