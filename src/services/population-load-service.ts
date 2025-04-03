// src/services/population-load-service.ts
import { PopulationTagData } from '../plugins/alight-population-plugin/ui/popmodal-modal-types';
import createdData from '../data/created-population-sample-data.json';
import allAuthData from '../data/all-authenticated-population-sample-data.json';
import systemData from '../data/system-population-sample-data.json';

/**
 * Service for loading population tag data from static JSON files
 */
export default class PopulationLoadService {
  /**
   * Loads all population tags from imported JSON files
   * 
   * @returns {Promise<PopulationTagData[]>} The loaded population tags
   */
  public async loadPopulationTags(): Promise<PopulationTagData[]> {
    try {
      console.log('Loading all population tags from static JSON files...');

      const combinedData: PopulationTagData[] = [
        ...this.transformCreatedPopulationData(createdData),
        ...this.transformAuthenticatedData(allAuthData),
        ...this.transformSystemPopulationData(systemData)
      ];

      console.log(`Combined ${combinedData.length} population tags from static files`);
      return combinedData;
    } catch (error) {
      console.warn('Failed to process population data:', error);
      return [];
    }
  }

  /**
   * Loads system population tags (combines both all-authenticated and system data)
   * 
   * @returns {Promise<PopulationTagData[]>} The loaded system population tags
   */
  public async loadSystemPopulationTags(): Promise<PopulationTagData[]> {
    try {
      console.log('Loading system population tags...');

      const systemTagsData: PopulationTagData[] = [
        ...this.transformAuthenticatedData(allAuthData),
        ...this.transformSystemPopulationData(systemData)
      ];

      console.log(`Loaded ${systemTagsData.length} system population tags`);
      return systemTagsData;
    } catch (error) {
      console.warn('Failed to process system population data:', error);
      return [];
    }
  }

  /**
   * Loads created population tags (combines created population data and all-authenticated data)
   * 
   * @returns {Promise<PopulationTagData[]>} The loaded created population tags
   */
  public async loadCreatedPopulationTags(): Promise<PopulationTagData[]> {
    try {
      console.log('Loading created population tags...');

      const createdTagsData: PopulationTagData[] = [
        ...this.transformCreatedPopulationData(createdData),
        ...this.transformAuthenticatedData(allAuthData)
      ];

      console.log(`Loaded ${createdTagsData.length} created population tags`);
      return createdTagsData;
    } catch (error) {
      console.warn('Failed to process created population data:', error);
      return [];
    }
  }

  private transformCreatedPopulationData(data: any): PopulationTagData[] {
    if (!data || !data.populationDetails || !Array.isArray(data.populationDetails)) {
      console.warn('Invalid Created Population data format');
      return [];
    }
    return data.populationDetails.map((item: any) => ({
      populationTagDetails: true,
      populationTagName: item.populationName || 'Unknown',
      populationTagDescription: item.populationDescription || '',
      baseOrClientSpecific: 'Client',
      pageType: 'Custom',
      destination: item.populationName || '',
      pageCode: item.populationId || '',
      domain: 'Custom',
      uniqueId: item.populationId || '',
      attributeName: 'population',
      attributeValue: item.populationFormula || ''
    }));
  }

  private transformAuthenticatedData(data: any): PopulationTagData[] {
    if (!data || !data.expressionDetails || !Array.isArray(data.expressionDetails)) {
      console.warn('Invalid All Authenticated Users data format');
      return [];
    }
    return data.expressionDetails.map((item: any) => ({
      populationTagDetails: true,
      populationTagName: item.expressionName || 'Unknown',
      populationTagDescription: item.expressionDescription || '',
      baseOrClientSpecific: 'Authentication',
      pageType: 'Authentication',
      destination: item.expressionName || '',
      pageCode: '',
      domain: 'Authentication',
      uniqueId: item.expressionName || '',
      attributeName: 'expression',
      attributeValue: item.expressionRevisions?.[0]?.expressionValue || ''
    }));
  }

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
}