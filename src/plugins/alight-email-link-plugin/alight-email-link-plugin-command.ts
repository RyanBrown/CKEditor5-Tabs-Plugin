// src/plugins/alight-email-link-plugin/alight-email-link-plugin-command.ts

// Import the necessary classes and functions from CKEditor5
import { Command } from '@ckeditor/ckeditor5-core';
import { findAttributeRange } from '@ckeditor/ckeditor5-typing';

// Define an interface for the plugin attributes.
// This interface includes an email property and an optional organization name.
export interface alightEmailLinkPluginAttributes {
  email: string;
  orgName?: string;
}

// Define the command class that extends CKEditor's Command.
// This command handles the adding, updating, or removing of the custom email link attribute.
export default class AlightEmailLinkPluginCommand extends Command {
  // Declare the value property that will hold the current attributes, if any.
  declare value: alightEmailLinkPluginAttributes | undefined;

  // Refresh the command's state.
  // Checks if the attribute is allowed in the current selection and retrieves its value.
  override refresh(): void {
    const model = this.editor.model;
    const selection = model.document.selection;

    // Log current selection and state for debugging.
    // console.log('[AlightEmailLinkPluginCommand] Refreshing command state.');
    // console.log('[AlightEmailLinkPluginCommand] Current selection:', selection);

    // Check if the 'alightEmailLinkPlugin' attribute is allowed in the current selection.
    this.isEnabled = model.schema.checkAttributeInSelection(selection, 'alightEmailLinkPlugin');
    // console.log('[AlightEmailLinkPluginCommand] isEnabled set to:', this.isEnabled);

    // Retrieve the current attribute value from the selection.
    this.value = selection.getAttribute('alightEmailLinkPlugin') as alightEmailLinkPluginAttributes;
    // console.log('[AlightEmailLinkPluginCommand] Current attribute value:', this.value);
  }

  // Execute the command.
  // Depending on whether attributes are provided, either adds/updates or removes the email link attribute.
  // @param attributes Optional attributes for the email link.
  override execute(attributes?: alightEmailLinkPluginAttributes): void {
    const model = this.editor.model;
    const selection = model.document.selection;

    // Log the execution command and the attributes provided.
    // console.log('[AlightEmailLinkPluginCommand] Executing command with attributes:', attributes);
    // console.log('[AlightEmailLinkPluginCommand] Current selection before change:', selection);

    // Begin model change block for making modifications.
    model.change(writer => {
      // If no attributes are provided, then remove the email link attribute.
      if (!attributes) {
        // console.log('[AlightEmailLinkPluginCommand] No attributes provided. Removing the attribute.');
        // Find the range where the current attribute is applied.
        const range = findAttributeRange(
          selection.getFirstPosition()!,
          'alightEmailLinkPlugin',
          this.value,
          model
        );
        // console.log('[AlightEmailLinkPluginCommand] Removing attribute in range:', range);
        // Remove the attribute from the found range.
        writer.removeAttribute('alightEmailLinkPlugin', range);
        return;
      }

      // Add or update link
      const range = selection.isCollapsed
        ? findAttributeRange(
          selection.getFirstPosition()!,
          'alightEmailLinkPlugin',
          this.value,
          model
        )
        : model.createRange(selection.getFirstPosition()!, selection.getLastPosition()!);

      // Log the range where the attribute will be applied.
      // console.log('[AlightEmailLinkPluginCommand] Applying attribute in range:', range);
      // Set the new attribute on the determined range.
      writer.setAttribute('alightEmailLinkPlugin', attributes, range);
    });
    // Log the completion of the command execution.
    // console.log('[AlightEmailLinkPluginCommand] Command execution completed.');
  }
}
