export interface ILinkManager {

  // Renders the content UI (including attaching events) into the container.
  renderContent(container: HTMLElement): void;

  // populates links modal with link data described by the sourceDataType, postProcess lambda (optional) runs wne done
  setModalContents(sourceDataType: string, postProcess: () => void): Promise<void>;
}
