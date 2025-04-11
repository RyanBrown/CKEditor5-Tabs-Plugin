// src/alight-common/ILinkManager.ts

export interface ILinkManager {

  // Renders the current UI (including attaching events) into the container.
  renderContent(container: HTMLElement): void;

  // populates links modal with link data described in sourceDataType. postProcess lambda (optional) runs when done
  // setModalContents(sourceDataType: string, postProcess: () => void): Promise<void>;
}
