// public-intranet-link.ts

/**
 * Returns the HTML content for both Public and Intranet links.
 * If isIntranet=true, we show an extra note or fields. 
 * existingHref and existingOrgName are used to pre-populate fields when editing.
 */
export async function getPublicIntranetLinkContent(
  existingHref: string = '',
  isIntranet: boolean = false,
  existingOrgName: string = ''
): Promise<string> {
  const intranetNote = isIntranet
    ? `
      <p><strong>Note:</strong> When an employee clicks on an intranet link, 
      a message will let them know they need to be connected 
      to that network to successfully continue.</p>
    `
    : '';

  return `
    <div class="public-intranet-link-content">
      ${intranetNote}

      <label for="url" class="ck-alight-input-label">URL</label>
      <input 
        id="url" 
        type="url" 
        class="ck-alight-input-text" 
        value="${existingHref}"
      />

      <label for="org-name" class="ck-alight-input-label">
        Organization Name (Optional)<span class="asterisk">*</span>
      </label>
      <input 
        id="org-name" 
        type="text" 
        class="ck-alight-input-text"
        value="${existingOrgName}"
      />

      <p>
        <span class="asterisk">*</span>
        Enter the third-party organization to inform users the destination of the link.
      </p>
    </div>
  `;
}
