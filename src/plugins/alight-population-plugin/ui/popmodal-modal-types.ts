// src/plugins/alight-population-plugin/ui/popmodal-modal-types.ts
export interface PopulationTagData {
  populationTagDetails: boolean;
  populationTagName: string;
  populationTagDescription: string;
  baseOrClientSpecific: string;
  pageType: string;
  destination: string;
  pageCode: string;
  domain: string;
  uniqueId: string | number;
  attributeName: string;
  attributeValue: string;
}

export interface SelectedFilters {
  [key: string]: string[];
  baseOrClientSpecific: string[];
  pageType: string[];
  domain: string[];
}
