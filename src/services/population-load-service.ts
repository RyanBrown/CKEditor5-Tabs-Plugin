// src/services/population-load-service.ts
import { PopulationTagData } from '../plugins/alight-population-plugin/ui/popmodal-modal-types';

/**
 * Service for loading population tag data from multiple sources
 */
export default class PopulationLoadService {
  /**
   * Loads population tags from all available sources
   * 
   * @returns {Promise<PopulationTagData[]>} The loaded population tags
   */
  public async loadPopulationTags(): Promise<PopulationTagData[]> {
    try {
      console.log('Loading population tags from multiple sources...');

      // Access the global sample data
      const allAuthenticatedData = (window as any).allAuthenticatedPopulationData;
      const existingDocumentData = (window as any).existingDocumentLinkData;
      const systemPopulationData = (window as any).systemPopulationData;

      // If data exists in the global scope, use it
      if (allAuthenticatedData || existingDocumentData || systemPopulationData) {
        console.log('Using data from global scope');

        // Combine all data sources
        const combinedData: PopulationTagData[] = [
          ...this.transformAuthenticatedData(allAuthenticatedData || {}),
          ...this.transformExistingDocumentData(existingDocumentData || {}),
          ...this.transformSystemPopulationData(systemPopulationData || {})
        ];

        console.log(`Combined ${combinedData.length} population tags from all sources`);
        return combinedData;
      }

      // If no data is available in global scope, try fetching from files
      console.log('No data found in global scope, trying to fetch from files...');
      try {
        const [allAuthResponse, docResponse, systemResponse] = await Promise.all([
          fetch('/data/all-authenticated-population-sample-data.json'),
          fetch('/data/existing-document-link-sample-data.json'),
          fetch('/data/system-population-sample-data.json')
        ]);

        const allAuthData = await allAuthResponse.json();
        const docData = await docResponse.json();
        const sysData = await systemResponse.json();

        // Combine all data sources
        const combinedData: PopulationTagData[] = [
          ...this.transformAuthenticatedData(allAuthData),
          ...this.transformExistingDocumentData(docData),
          ...this.transformSystemPopulationData(sysData)
        ];

        console.log(`Combined ${combinedData.length} population tags from fetched files`);
        return combinedData;
      } catch (fetchError) {
        console.warn('Failed to fetch population data from files:', fetchError);
        // Fall back to mock data
        return this.getMockPopulationTags();
      }
    } catch (error) {
      console.error('Error loading population tags:', error);
      return this.getMockPopulationTags();
    }
  }

  /**
   * Transforms the "All Authenticated Users" data format
   */
  private transformAuthenticatedData(data: any): PopulationTagData[] {
    if (!data || !data.expressionDetails || !Array.isArray(data.expressionDetails)) {
      console.warn('Invalid All Authenticated Users data format');
      return [];
    }

    return data.expressionDetails.map((item: { expressionName: any; expressionDescription: any; expressionRevisions: { expressionValue: any; }[]; }) => ({
      populationTagDetails: true,
      populationTagName: item.expressionName || 'Unknown',
      populationTagDescription: item.expressionDescription || '',
      baseOrClientSpecific: 'System',
      pageType: 'Authentication',
      destination: item.expressionName || '',
      pageCode: '',
      domain: 'Authentication',
      uniqueId: item.expressionName || '',
      attributeName: 'expression',
      attributeValue: item.expressionRevisions?.[0]?.expressionValue || ''
    }));
  }

  /**
   * Transforms the existing document link data format
   */
  private transformExistingDocumentData(data: any): PopulationTagData[] {
    if (!data || !data.documentList || !Array.isArray(data.documentList)) {
      console.warn('Invalid Existing Document Link data format');
      return [];
    }

    // Extract unique population values from documents
    const uniquePopulations = new Set<string>();
    data.documentList.forEach((doc: { population: string; }) => {
      if (doc.population) {
        uniquePopulations.add(doc.population);
      }
    });

    // Create population tag data from unique populations
    return Array.from(uniquePopulations).map(population => ({
      populationTagDetails: true,
      populationTagName: population,
      populationTagDescription: `Document population: ${population}`,
      baseOrClientSpecific: 'Document',
      pageType: 'Document',
      destination: population,
      pageCode: '',
      domain: 'Document',
      uniqueId: population,
      attributeName: 'population',
      attributeValue: population
    }));
  }

  /**
   * Transforms the system population data format
   */
  private transformSystemPopulationData(data: any): PopulationTagData[] {
    if (!data || !data.expressionDetails || !Array.isArray(data.expressionDetails)) {
      console.warn('Invalid System Population data format');
      return [];
    }

    return data.expressionDetails.map((item: any) => ({
      populationTagDetails: true,
      populationTagName: item.expressionName || 'Unknown',
      populationTagDescription: item.expressionDescription || '',
      baseOrClientSpecific: item.clientFacing ? 'Client' : 'System',
      pageType: item.expressionType || 'PORTAL',
      destination: item.expressionName || '',
      pageCode: '',
      domain: item.expressionType || 'PORTAL',
      uniqueId: item.expressionName || '',
      attributeName: 'expression',
      attributeValue: item.expressionRevisions?.[0]?.expressionValue || ''
    }));
  }

  /**
   * Provides mock population tag data as a fallback
   */
  private getMockPopulationTags(): PopulationTagData[] {
    return [
      {
        populationTagDetails: true,
        populationTagName: 'Admins',
        populationTagDescription: 'Website administrators',
        baseOrClientSpecific: 'Base',
        pageType: 'Admin',
        destination: 'admin',
        pageCode: 'admin-section',
        domain: 'main',
        uniqueId: '1',
        attributeName: 'role',
        attributeValue: 'admin'
      },
      {
        populationTagDetails: true,
        populationTagName: 'Registered Users',
        populationTagDescription: 'All registered users on the platform',
        baseOrClientSpecific: 'Base',
        pageType: 'All',
        destination: 'registered',
        pageCode: 'user-section',
        domain: 'main',
        uniqueId: '2',
        attributeName: 'registered',
        attributeValue: 'true'
      },
      {
        populationTagDetails: true,
        populationTagName: 'Premium Members',
        populationTagDescription: 'Users with premium subscription',
        baseOrClientSpecific: 'Client',
        pageType: 'Membership',
        destination: 'premium',
        pageCode: 'premium-section',
        domain: 'membership',
        uniqueId: '3',
        attributeName: 'membership',
        attributeValue: 'premium'
      }
    ];
  }
}