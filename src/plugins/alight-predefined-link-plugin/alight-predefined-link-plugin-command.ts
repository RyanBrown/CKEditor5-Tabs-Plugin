// src/plugins/alight-predefined-link-plugin/alight-predefined-link-plugin-command.ts
import { Command } from '@ckeditor/ckeditor5-core';
import { findAttributeRange } from '@ckeditor/ckeditor5-typing';

// Define an interface for the plugin attributes.
// This interface includes an url property.
export interface alightPredefinedLinkPluginAttributes {
  url: string;
}

// Define the command class that extends CKEditor's Command.
// This command handles the adding, updating, or removing of the custom url link attribute.
export default class AlightPredefinedLinkPluginCommand extends Command {
  // Declare the value property that will hold the current attributes, if any.
  declare value: alightPredefinedLinkPluginAttributes | undefined;

  // Refresh the command's state.
  // Checks if the attribute is allowed in the current selection and retrieves its value.
  override refresh(): void {
    const model = this.editor.model;
    const selection = model.document.selection;

    // Log current selection and state for debugging.
    // console.log('[AlightPredefinedLinkPluginCommand] Refreshing command state.');
    // console.log('[AlightPredefinedLinkPluginCommand] Current selection:', selection);

    // Check if the 'alightPredefinedLinkPlugin' attribute is allowed in the current selection.
    this.isEnabled = model.schema.checkAttributeInSelection(selection, 'alightPredefinedLinkPlugin');
    // console.log('[AlightPredefinedLinkPluginCommand] isEnabled set to:', this.isEnabled);

    // Retrieve the current attribute value from the selection.
    this.value = selection.getAttribute('alightPredefinedLinkPlugin') as alightPredefinedLinkPluginAttributes;
    // console.log('[AlightPredefinedLinkPluginCommand] Current attribute value:', this.value);
  }

  // Execute the command.
  // Depending on whether attributes are provided, either adds/updates or removes the url link attribute.
  // @param attributes Optional attributes for the url link.
  override execute(attributes?: alightPredefinedLinkPluginAttributes): void {
    const model = this.editor.model;
    const selection = model.document.selection;

    // Log the execution command and the attributes provided.
    // console.log('[AlightPredefinedLinkPluginCommand] Executing command with attributes:', attributes);
    // console.log('[AlightPredefinedLinkPluginCommand] Current selection before change:', selection);

    // Begin model change block for making modifications.
    model.change(writer => {
      // If no attributes are provided, then remove the url link attribute.
      if (!attributes) {
        // console.log('[AlightPredefinedLinkPluginCommand] No attributes provided. Removing the attribute.');
        // Find the range where the current attribute is applied.
        const range = findAttributeRange(
          selection.getFirstPosition()!,
          'alightPredefinedLinkPlugin',
          this.value,
          model
        );
        // console.log('[AlightPredefinedLinkPluginCommand] Removing attribute in range:', range);
        // Remove the attribute from the found range.
        writer.removeAttribute('alightPredefinedLinkPlugin', range);
        return;
      }

      // Add or update link
      const range = selection.isCollapsed
        ? findAttributeRange(
          selection.getFirstPosition()!,
          'alightPredefinedLinkPlugin',
          this.value,
          model
        )
        : model.createRange(selection.getFirstPosition()!, selection.getLastPosition()!);

      // Log the range where the attribute will be applied.
      // console.log('[AlightPredefinedLinkPluginCommand] Applying attribute in range:', range);
      // Set the new attribute on the determined range.
      writer.setAttribute('alightPredefinedLinkPlugin', attributes, range);
    });
    // Log the completion of the command execution.
    // console.log('[AlightPredefinedLinkPluginCommand] Command execution completed.');
  }
}