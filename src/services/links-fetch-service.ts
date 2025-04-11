// src/services/links-fetch-service.ts
import categorySampleData from "./../data/category-sample-data.json";
import predefinedLinksSampleData from "./../data/predefined-link-sample-data.json";
import existingDocumentLinksSampleData from "./../data/existing-document-link-sample-data.json";
import { PredefinedLink } from "../plugins/alight-predefined-link-plugin/ui/linkmodal-modal-types";
import HttpService from "./http-service";
import { DataSourceLinks } from "../data-sources/custom-source/data-source-links";
import { DocumentLink } from "../plugins/alight-existing-document-link-plugin/ui/linkmodal-modal-types";
import { IReadSource, IWriteSource } from "../data-sources/base-source/data-source";
import { DataSourceDocs, IReadSourceDocs } from "../data-sources/custom-source/data-source-docs";

export default class LinksFetchService extends HttpService {
  private readonly _categorySampleMode: boolean = true;
  private readonly _documentLinksMockarooUrl: string = "https://api.mockaroo.com/api/42e2d380?count=1&key=b3c0df80";
  private readonly _predefinedLinksMockarooUrl: string = "https://api.mockaroo.com/api/e56cdc30?count=1&key=b3c0df80";
  private readonly _useSampleDataAsFallback: boolean = true;

  public fetchPredefinedLinks = async (): Promise<PredefinedLink[]> => {
    try {
      // Try to fetch from Mockaroo API
      console.log('Fetching predefined links from Mockaroo...');
      const response = await fetch(this._predefinedLinksMockarooUrl);
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log('Received data from Mockaroo:', data);

      // Handle nested predefinedLinksDetails structure (like in the large dataset)
      if (data && Array.isArray(data) && data.length > 0 && data[0].predefinedLinksDetails) {
        console.log(`Found nested predefinedLinksDetails in data array`);

        // Process the nested structure
        let processedLinks: PredefinedLink[] = [];

        for (const item of data) {
          if (item.predefinedLinksDetails && Array.isArray(item.predefinedLinksDetails)) {
            console.log(`Processing ${item.predefinedLinksDetails.length} nested links for ${item.pageCode || 'unknown'}`);

            // Process each nested link and add parent data
            item.predefinedLinksDetails.forEach((nestedLink: any) => {
              processedLinks.push({
                // Base properties from parent item
                baseOrClientSpecific: nestedLink.baseOrClientSpecific || item.baseOrClientSpecific || 'base',
                pageType: nestedLink.pageType || item.pageType || 'Unknown',
                pageCode: nestedLink.pageCode || item.pageCode || '',
                domain: nestedLink.domain || item.domain || '',

                // Properties from nested link
                predefinedLinkName: nestedLink.predefinedLinkName || nestedLink.name || 'Unnamed Link',
                predefinedLinkDescription: nestedLink.description || nestedLink.predefinedLinkDescription || '',
                destination: nestedLink.url || nestedLink.destination || '',
                uniqueId: nestedLink.id || nestedLink.uniqueId || '',
                attributeName: nestedLink.attributeName || '',
                attributeValue: nestedLink.attributeValue || '',
                predefinedLinksDetails: false
              });
            });
          }
        }

        console.log(`Processed ${processedLinks.length} total links`);
        return processedLinks;
      }

      // If the data is already in the format we expect
      if (Array.isArray(data) && data.length > 0) {
        console.log('Data is an array, returning directly');
        return data as PredefinedLink[];
      }

      // If data has predefinedLinksDetails property
      if (data && data.predefinedLinksDetails && Array.isArray(data.predefinedLinksDetails)) {
        console.log('Found predefinedLinksDetails array');
        return data.predefinedLinksDetails as PredefinedLink[];
      }

      // Look at all properties for arrays that might contain links
      for (const key in data) {
        if (Array.isArray(data[key]) && data[key].length > 0) {
          console.log(`Checking array in property: ${key}`);
          // Check if this array contains objects that look like links
          const firstItem = data[key][0];
          if (firstItem && typeof firstItem === 'object') {
            // If it has common link properties, use this array
            if ('predefinedLinkName' in firstItem ||
              'uniqueId' in firstItem ||
              'destination' in firstItem) {
              console.log(`Found link-like array in property: ${key}`);
              return data[key] as PredefinedLink[];
            }
          }
        }
      }

      console.warn('No valid predefined links structure found in Mockaroo response');

      // Process the sample data if it has the nested structure
      if (predefinedLinksSampleData && predefinedLinksSampleData.predefinedLinksDetails) {
        return this.processLinks(predefinedLinksSampleData.predefinedLinksDetails as PredefinedLink[]);
      }

      return predefinedLinksSampleData.predefinedLinksDetails as PredefinedLink[];
    } catch (error) {
      console.error("Error fetching predefined links from Mockaroo:", error);

      // If using sample data as fallback is enabled, return sample data
      if (this._useSampleDataAsFallback) {
        console.log("Using sample data as fallback for predefined links");
        // Process the sample data if it has the nested structure
        if (predefinedLinksSampleData && predefinedLinksSampleData.predefinedLinksDetails) {
          return this.processLinks(predefinedLinksSampleData.predefinedLinksDetails as PredefinedLink[]);
        }
        return predefinedLinksSampleData.predefinedLinksDetails as PredefinedLink[];
      }

      // Otherwise try the regular API
      console.log("Attempting to fetch predefined links from regular API...");
      let dataSource: IReadSource = new DataSourceLinks(this.alightRequest._apiUrl);
      return this.get(dataSource)
        .then(
          (response: string): PredefinedLink[] => {
            try {
              const parsedData = JSON.parse(response);
              if (parsedData && parsedData.predefinedLinksDetails) {
                return this.processLinks(parsedData.predefinedLinksDetails as PredefinedLink[]);
              }
              return parsedData.predefinedLinksDetails as PredefinedLink[];
            } catch (parseError) {
              console.error("Error parsing predefined links API response:", parseError);
              return [];
            }
          }
        )
        .catch((apiError: Error): PredefinedLink[] => {
          console.error("Error with regular API call for predefined links:", apiError);
          return [];
        });
    }
  }

  private processLinks = (rawLinks: PredefinedLink[]) => {
    // Check if we have the nested predefinedLinksDetails structure
    // and extract the actual links from it
    let processedLinks: any[] = [];

    // If the first item has a predefinedLinksDetails array, we have a nested structure
    if (rawLinks.length > 0 && 'predefinedLinksDetails' in rawLinks[0] && Array.isArray(rawLinks[0].predefinedLinksDetails)) {
      console.log("Processing nested predefined links structure");

      for (const rawLink of rawLinks as PredefinedLink[]) {
        if (rawLink.predefinedLinksDetails && Array.isArray(rawLink.predefinedLinksDetails)) {
          console.log(`Found ${rawLink.predefinedLinksDetails.length} nested links for ${rawLink.pageCode || 'unknown'}`);

          // Process each nested link and add parent data
          rawLink.predefinedLinksDetails.forEach((nestedLink) => {
            processedLinks.push({
              // Base properties from parent link
              baseOrClientSpecific: nestedLink.baseOrClientSpecific || rawLink.baseOrClientSpecific || 'base',
              pageType: nestedLink.pageType || rawLink.pageType || 'Unknown',
              pageCode: nestedLink.pageCode || rawLink.pageCode || '',
              domain: nestedLink.domain || rawLink.domain || '',

              // Properties from nested link
              predefinedLinkName: nestedLink.linkName || nestedLink.name || nestedLink.predefinedLinkName || 'Unnamed Link',
              predefinedLinkDescription: nestedLink.description || nestedLink.predefinedLinkDescription || '',
              destination: nestedLink.url || nestedLink.destination || '',
              uniqueId: nestedLink.id || nestedLink.uniqueId || '',
              attributeName: nestedLink.attributeName || '',
              attributeValue: nestedLink.attributeValue || ''
            });
          });
        }
      }
    } else {
      // Standard links without nesting
      processedLinks = rawLinks;
    }

    // Filter out any invalid links
    return processedLinks.filter(link =>
      link.destination && link.destination.trim() !== '' &&
      (link.predefinedLinkName || link.name) &&
      (link.predefinedLinkName || link.name).trim() !== ''
    );
  };

  public fetchDocumentLinks = async (): Promise<DocumentLink[]> => {
    try {
      // Try to fetch from Mockaroo API
      console.log('Fetching document links from Mockaroo...');
      const response = await fetch(this._documentLinksMockarooUrl);
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log('Received document data from Mockaroo:', data);

      // If the data is already in the format we expect
      if (Array.isArray(data) && data.length > 0) {
        console.log('Document data is an array, returning directly');
        return data as DocumentLink[];
      }

      // Check if data has documentList property
      if (data && data.documentList && Array.isArray(data.documentList)) {
        console.log('Found documentList array');
        return data.documentList as DocumentLink[];
      }

      // Look at all properties for arrays that might contain document links
      for (const key in data) {
        if (Array.isArray(data[key]) && data[key].length > 0) {
          console.log(`Checking array in property: ${key}`);
          // Check if this array contains objects that look like document links
          const firstItem = data[key][0];
          if (firstItem && typeof firstItem === 'object') {
            // If it has common document link properties, use this array
            if ('fileId' in firstItem ||
              'serverFilePath' in firstItem ||
              'title' in firstItem) {
              console.log(`Found document-like array in property: ${key}`);
              return data[key] as DocumentLink[];
            }
          }
        }
      }

      console.warn('No valid document links structure found in Mockaroo response');
      return existingDocumentLinksSampleData.documentList as DocumentLink[];
    } catch (error) {
      console.error("Error fetching document links from Mockaroo:", error);

      // If using sample data as fallback is enabled, return sample data
      if (this._useSampleDataAsFallback) {
        console.log("Using sample data as fallback for document links");
        return existingDocumentLinksSampleData.documentList as DocumentLink[];
      }

      // Otherwise try the regular API
      console.log("Attempting to fetch document links from regular API...");
      let dataSource: IReadSource = new DataSourceDocs(this.alightRequest._apiUrl, this.alightRequest._clientId);
      return this.get(dataSource)
        .then((response: string): DocumentLink[] => {
          try {
            return JSON.parse(response).documentList as DocumentLink[];
          } catch (parseError) {
            console.error("Error parsing document links API response:", parseError);
            return [];
          }
        })
        .catch((apiError: Error): DocumentLink[] => {
          console.error("Error with regular API call for document links:", apiError);
          return [];
        });
    }
  }

  public fetchCategories = (): Promise<string[]> => {
    if (this._categorySampleMode)
      return Promise.resolve(categorySampleData.categoryList as string[]);

    let dataSource: IReadSourceDocs = new DataSourceDocs(this.alightRequest._apiUrl, this.alightRequest._clientId);
    return this.get(dataSource.dataSourceCategory)
      .then((response: string): string[] => {
        try {
          return JSON.parse(response).categoryList as string[];
        } catch (error) {
          console.error("Error parsing categories response:", error);
          return [];
        }
      })
      .catch((error: Error): string[] => {
        console.error("Error fetching categories:", error);
        return [];
      });
  }

  public saveDocument = (document: Record<string, any>): Promise<string> => {
    let dataSource: IWriteSource = new DataSourceDocs(this.alightRequest._apiUrl, this.alightRequest._clientId);
    return this.post(dataSource, document)
      .catch((error: Error): string => {
        console.error("Error saving document:", error);
        return JSON.stringify({ status: "ERROR", message: error.message });
      });
  }
}

// // src/services/links-fetch-service.ts
// import categorySampleData from "./../data/category-sample-data.json";
// import existingDocSampleData from "./../data/existing-document-link-sample-data.json";
// import predefinedLinkSampleData from "./../data/predefined-link-sample-data.json";
// import { PredefinedLink } from "../plugins/alight-predefined-link-plugin/ui/linkmodal-modal-types";
// import HttpService from "./http-service";
// import { DataSourceLinks } from "../data-sources/custom-source/data-source-links";
// import { DocumentLink } from "../plugins/alight-existing-document-link-plugin/ui/linkmodal-modal-types";
// import { IReadSource, IWriteSource } from "../data-sources/base-source/data-source";
// import { DataSourceDocs, IReadSourceDocs } from "../data-sources/custom-source/data-source-docs";

// export default class LinksFetchService extends HttpService {
//   private readonly _categorySampleMode: boolean = true;
//   private readonly _documentLinksSampleMode: boolean = false;
//   private readonly _predefinedLinksSampleMode: boolean = false;

//   public fetchPredefinedLinks = async (): Promise<PredefinedLink[]> => {

//     if (this._predefinedLinksSampleMode)
//       return Promise.resolve(predefinedLinkSampleData.predefinedLinksDetails as PredefinedLink[]);

//     let dataSource: IReadSource = new DataSourceLinks(this.alightRequest._apiUrl);
//     return await this.get(dataSource)
//       .then(
//         response => JSON.parse(response).predefinedLinksDetails as PredefinedLink[]
//         // error => console.error(error) // TODO switch this to return new Promise
//       );
//   }

//   public fetchDocumentLinks = (): Promise<DocumentLink[]> => {
//     if (this._documentLinksSampleMode)
//       return Promise.resolve(existingDocSampleData.documentList as DocumentLink[]);

//     let dataSource: IReadSource = new DataSourceDocs(this.alightRequest._apiUrl, this.alightRequest._clientId);
//     return this.get(dataSource)
//       .then(response => JSON.parse(response).documentList as DocumentLink[]);
//   }

//   public fetchCategories = (): Promise<string[]> => {
//     if (this._categorySampleMode)
//       return Promise.resolve(categorySampleData.categoryList as string[]);

//     let dataSource: IReadSourceDocs = new DataSourceDocs(this.alightRequest._apiUrl, this.alightRequest._clientId);
//     return this.get(dataSource.dataSourceCategory)
//       .then(response => JSON.parse(response).categoryList as string[]);
//   }

//   public saveDocument = (document: Record<string, any>): Promise<string> => {
//     let dataSource: IWriteSource = new DataSourceDocs(this.alightRequest._apiUrl, this.alightRequest._clientId);
//     return this.post(dataSource, document);
//   }
// }

