// src/services/population-load-service.ts
import { PopulationTagData } from '../plugins/alight-population-plugin/ui/popmodal-modal-types';
// In a real implementation, you would import from a JSON file like this:
// import sampleData from '../data/population-sample-data.json';

/**
 * Service for loading population tag data
 */
export default class PopulationLoadService {
  /**
   * Loads population tags from the API or sample data
   * 
   * @returns {Promise<PopulationTagData[]>} The loaded population tags
   */
  public async loadPopulationTags(): Promise<PopulationTagData[]> {
    try {
      // Load the sample data
      // In a real implementation, you would use an import or fetch call
      // For this example, let's assume we can access it from window or similar

      // Option 1: Try to fetch from a static URL (if your application serves JSON files)
      let sampleData;
      try {
        const response = await fetch('/data/population-sample-data.json');
        sampleData = await response.json();
      } catch (fetchError) {
        console.warn('Could not fetch population data, using fallback:', fetchError);
        // Option 2: Access from global window object if populated by your app
        sampleData = (window as any).populationSampleData || {};

        // If still no data, use mock data as a last resort
        if (!sampleData.populationTagsDetails) {
          console.warn('Using mock population tags data as fallback');
          return this.getMockPopulationTags();
        }
      }

      console.log('Population sample data loaded:', sampleData);

      // Transform and return the population tags
      return this.transformSampleData(sampleData);
    } catch (error) {
      console.error('Error loading population tags:', error);
      // Use mock data as fallback
      return this.getMockPopulationTags();
    }
  }

  /**
   * Transforms the sample data format to match the expected PopulationTagData format
   * 
   * @param sampleData The sample data to transform
   * @returns {PopulationTagData[]} The transformed population tags
   */
  private transformSampleData(sampleData: any): PopulationTagData[] {
    // Extract the population tags details
    const populationTagsDetails = sampleData.populationTagsDetails || [];

    if (!populationTagsDetails.length) {
      console.warn('No population tags details found in sample data');
      return [];
    }

    // Transform to match the expected format
    return populationTagsDetails.map((tag: any) => ({
      populationTagDetails: true,
      populationTagName: tag.populationTagName || '',
      populationTagDescription: tag.populationTagDescription || '',
      baseOrClientSpecific: tag.baseOrClientSpecific || '',
      pageType: tag.pageType || '',
      destination: tag.destination || '',
      pageCode: tag.pageCode || '',
      domain: tag.domain || '',
      uniqueId: tag.uniqueId || '',
      attributeName: tag.attributeName || '',
      attributeValue: tag.attributeValue || ''
    }));
  }

  /**
   * Provides mock population tag data for development purposes
   * 
   * @returns {PopulationTagData[]} Mock population tags
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
      // Additional entries removed for brevity
    ];
  }
}