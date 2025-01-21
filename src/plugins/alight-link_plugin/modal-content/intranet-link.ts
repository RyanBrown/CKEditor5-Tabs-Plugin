export async function getIntranetLinkContent(): Promise<string> {
    // Placeholder content for public website links
    return `
  <div class="intranet-link-content">
    <p>
      <strong>Note:</strong> When an employee clicks on an intranet link, 
      a message will let them know they need to be connected 
      to that network to successfully continue.
    </p>

    <label for="url" class="ck-alight-input-label">URL</label>
    <input id="url" type="url" class="ck-alight-input-text">

    <label for="org-name" class="ck-alight-input-label">Organization Name (Optional)<span class="asterisk">*</span></label>
    <input id="org-name" type="text" class="ck-alight-input-text">

    <p>
      <span class="asterisk">*</span>Enter the third-party organization to inform users the destination of the link.
    </p>
  </div>
`;
}
