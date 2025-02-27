// src/plugins/alight-balloon-link-plugin/alight-balloon-link-plugin-command.ts

// Import the necessary classes and functions from CKEditor5
import { Command } from '@ckeditor/ckeditor5-core';
import { findAttributeRange } from '@ckeditor/ckeditor5-typing';

// Define an interface for the plugin attributes.
// This interface includes an email property and an optional organization name.
export interface alightBalloonLinkPluginAttributes {
  email: string;
  orgName?: string;
}

// Define the command class that extends CKEditor's Command.
// This command handles the adding, updating, or removing of the custom email link attribute.
export default class AlightBalloonLinkPluginCommand extends Command {
  // Declare the value property that will hold the current attributes, if any.
  declare value: alightBalloonLinkPluginAttributes | undefined;

  // Refresh the command's state.
  // Checks if the attribute is allowed in the current selection and retrieves its value.
  override refresh(): void {
    const model = this.editor.model;
    const selection = model.document.selection;

    // Log current selection and state for debugging.
    // console.log('[AlightBalloonLinkPluginCommand] Refreshing command state.');
    // console.log('[AlightBalloonLinkPluginCommand] Current selection:', selection);

    // Check if the 'alightBalloonLinkPlugin' attribute is allowed in the current selection.
    this.isEnabled = model.schema.checkAttributeInSelection(selection, 'alightBalloonLinkPlugin');
    // console.log('[AlightBalloonLinkPluginCommand] isEnabled set to:', this.isEnabled);

    // Retrieve the current attribute value from the selection.
    this.value = selection.getAttribute('alightBalloonLinkPlugin') as alightBalloonLinkPluginAttributes;
    // console.log('[AlightBalloonLinkPluginCommand] Current attribute value:', this.value);
  }

  // Execute the command.
  // Depending on whether attributes are provided, either adds/updates or removes the email link attribute.
  // @param attributes Optional attributes for the email link.
  override execute(attributes?: alightBalloonLinkPluginAttributes): void {
    const model = this.editor.model;
    const selection = model.document.selection;

    // Log the execution command and the attributes provided.
    // console.log('[AlightBalloonLinkPluginCommand] Executing command with attributes:', attributes);
    // console.log('[AlightBalloonLinkPluginCommand] Current selection before change:', selection);

    // Begin model change block for making modifications.
    model.change(writer => {
      // If no attributes are provided, then remove the email link attribute.
      if (!attributes) {
        // console.log('[AlightBalloonLinkPluginCommand] No attributes provided. Removing the attribute.');
        // Find the range where the current attribute is applied.
        const range = findAttributeRange(
          selection.getFirstPosition()!,
          'alightBalloonLinkPlugin',
          this.value,
          model
        );
        // console.log('[AlightBalloonLinkPluginCommand] Removing attribute in range:', range);
        // Remove the attribute from the found range.
        writer.removeAttribute('alightBalloonLinkPlugin', range);
        return;
      }

      // Add or update link
      const range = selection.isCollapsed
        ? findAttributeRange(
          selection.getFirstPosition()!,
          'alightBalloonLinkPlugin',
          this.value,
          model
        )
        : model.createRange(selection.getFirstPosition()!, selection.getLastPosition()!);

      // Log the range where the attribute will be applied.
      // console.log('[AlightBalloonLinkPluginCommand] Applying attribute in range:', range);
      // Set the new attribute on the determined range.
      writer.setAttribute('alightBalloonLinkPlugin', attributes, range);
    });
    // Log the completion of the command execution.
    // console.log('[AlightBalloonLinkPluginCommand] Command execution completed.');
  }
}
