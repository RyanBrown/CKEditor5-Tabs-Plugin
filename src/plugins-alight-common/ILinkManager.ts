export interface ILinkManager {
  renderContent(container: HTMLElement): void;
  setModalContents(sourceDataType: string, postProcess: () => void): Promise<void>;
}
