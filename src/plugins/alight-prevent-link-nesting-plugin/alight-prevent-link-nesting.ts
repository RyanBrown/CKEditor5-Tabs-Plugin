// src/plugins/alight-prevent-link-nesting-plugin/alight-prevent-link-nesting.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { findAttributeRange } from '@ckeditor/ckeditor5-typing';
import type { Range, Selection, DocumentSelection } from '@ckeditor/ckeditor5-engine';
import type { Editor } from '@ckeditor/ckeditor5-core';
import { CkAlightModalDialog, DialogButton } from './../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';
import type { AlightPreventLinkNestingPluginConfig } from './types';

/**
 * Plugin that automatically prevents link nesting across different link plugins.
 * This plugin acts as a global manager for all link-related operations.
 */
export class AlightPreventLinkNestingPlugin extends Plugin {
  /**
   * @inheritDoc
   */
  static get pluginName() {
    return 'AlightPreventLinkNesting';
  }

  /**
   * Store of link attribute names that are managed by this plugin
   */
  private linkAttributes: string[] = [];

  /**
   * Option to merge overlapping links
   */
  private mergeOverlappingLinks: boolean = true;

  /**
   * Option to show warning modal
   */
  private showWarningModal: boolean = true;

  /**
   * Warning message for modal
   */
  private warningMessage: string = 'Links cannot be nested inside existing links.';

  /**
   * Active modal instance
   */
  private activeModal: CkAlightModalDialog | null = null;

  /**
   * @inheritDoc
   */
  init() {
    const editor = this.editor;

    // Load configuration
    const config = editor.config.get('alightPreventLinkNesting') as AlightPreventLinkNestingPluginConfig;

    // Set up link attributes to monitor
    if (config && config.linkAttributes && config.linkAttributes.length > 0) {
      this.linkAttributes = config.linkAttributes;
    } else {
      // Default to common Alight Editor link attribute names if not specified
      this.linkAttributes = [
        'linkHref',
        'alightExternalLinkPluginHref',
        'alightPredefinedLinkPluginHref',
        'alightEmailLinkPluginHref',
        'alightExistingDocumentLinkPluginHref',
        'alightNewDocumentLinkPluginHref'
      ];
    }

    // Set merge option
    if (config && config.mergeOverlappingLinks !== undefined) {
      this.mergeOverlappingLinks = config.mergeOverlappingLinks;
    }

    // Set warning modal option
    if (config && config.showWarningModal !== undefined) {
      this.showWarningModal = config.showWarningModal;
    }

    // Set warning message
    if (config && config.warningMessage) {
      this.warningMessage = config.warningMessage;
    }

    // Register schema restrictions
    this._addLinkNestingRestrictions();

    // Register post-fixers
    this._registerPostFixers();

    // Listen for link command execution
    this._listenToLinkCommands();

    // Monitor selection changes and clipboard operations
    this._monitorSelectionChanges();
    this._monitorClipboardOperations();

    console.log('AlightPreventLinkNestingPlugin initialized with link attributes:', this.linkAttributes);
  }

  /**
   * Add link nesting restrictions to the schema
   */
  private _addLinkNestingRestrictions() {
    const editor = this.editor;
    const schema = editor.model.schema;
    const linkAttributes = this.linkAttributes;

    // For each link attribute, add schema restrictions
    for (const attributeName of linkAttributes) {
      schema.addAttributeCheck((context, attributeToCheck) => {
        // Only check our monitored link attributes
        if (!linkAttributes.includes(attributeToCheck)) {
          return true;
        }

        // Check if any parent already has a link attribute
        const node = context.getItem(0);
        if (!node) {
          return true;
        }

        // Check all ancestors
        const ancestors = [];
        ancestors.push(node);

        // Safely access node.parent (TypeScript workaround)
        type NodeWithParent = { parent?: any };
        const modelNode = node as NodeWithParent;

        if (modelNode && modelNode.parent) {
          let parentNode = modelNode.parent as NodeWithParent;
          while (parentNode) {
            ancestors.push(parentNode);
            parentNode = parentNode.parent;
          }
        }

        // Check if any ancestor already has ANY link attribute
        return !ancestors.some(ancestor => {
          // Cast to any to access hasAttribute safely
          const modelAncestor = ancestor as any;
          return modelAncestor &&
            typeof modelAncestor.hasAttribute === 'function' &&
            linkAttributes.some(attr => modelAncestor.hasAttribute(attr));
        });
      });
    }
  }

  /**
   * Register post-fixers to correct any link nesting issues
   */
  private _registerPostFixers() {
    const editor = this.editor;
    const model = editor.model;
    const linkAttributes = this.linkAttributes;

    // Register post-fixer for link nesting
    model.document.registerPostFixer(writer => {
      let hasChanges = false;
      const changes = model.document.differ.getChanges();

      for (const change of changes) {
        // Look for insert operations or attribute changes related to links
        if (change.type === 'insert' ||
          (change.type === 'attribute' && linkAttributes.includes(change.attributeKey))) {

          // Fix any potential link nesting
          const result = this._fixLinkNesting(writer, change);
          hasChanges = hasChanges || result;
        }
      }

      return hasChanges;
    });
  }

  /**
   * Fix nested links by removing the link attribute from text nodes
   * that would create nested links
   * 
   * @param writer The model writer
   * @param change The change that might create nested links
   * @returns True if any changes were made, false otherwise
   */
  private _fixLinkNesting(writer: any, change: any): boolean {
    const model = this.editor.model;
    const linkAttributes = this.linkAttributes;
    let hasChanges = false;

    if (change.type === 'insert') {
      // Handle inserted content that might create nested links
      const range = model.createRange(
        change.position,
        change.position.getShiftedBy(change.length)
      );

      hasChanges = this._fixLinkNestingInRange(writer, range);
    } else if (change.type === 'attribute' && linkAttributes.includes(change.attributeKey)) {
      // Handle attribute changes that might create nested links
      hasChanges = this._fixLinkNestingInRange(writer, change.range);

      // Additionally, if it's a link attribute, automatically remove any other link attributes
      // This ensures we don't have multiple link types on the same text
      if (this._hasMultipleLinkAttributes(change.range)) {
        hasChanges = this._removeOtherLinkAttributes(writer, change.range, change.attributeKey) || hasChanges;
      }
    }

    return hasChanges;
  }

  /**
   * Checks if a range has multiple link attributes
   * 
   * @param range The range to check
   * @returns True if any item in the range has multiple link attributes
   */
  private _hasMultipleLinkAttributes(range: Range): boolean {
    const linkAttributes = this.linkAttributes;

    for (const item of range.getItems()) {
      if (item.is('$text')) {
        let linkAttrCount = 0;
        for (const attr of linkAttributes) {
          if (item.hasAttribute(attr)) {
            linkAttrCount++;
            if (linkAttrCount > 1) {
              return true;
            }
          }
        }
      }
    }

    return false;
  }

  /**
   * Removes other link attributes from a range, keeping only the specified one
   * 
   * @param writer The model writer
   * @param range The range to process
   * @param keepAttribute The attribute to keep
   * @returns True if any changes were made
   */
  private _removeOtherLinkAttributes(writer: any, range: Range, keepAttribute: string): boolean {
    const linkAttributes = this.linkAttributes;
    let hasChanges = false;

    for (const item of range.getItems()) {
      if (item.is('$text')) {
        for (const attr of linkAttributes) {
          if (attr !== keepAttribute && item.hasAttribute(attr)) {
            writer.removeAttribute(attr, item);
            hasChanges = true;
          }
        }
      }
    }

    return hasChanges;
  }

  /**
   * Shows a warning dialog when a link nesting is attempted
   */
  private _showNestedLinkWarningDialog(): void {
    if (!this.showWarningModal) {
      return;
    }

    // Close any existing modal
    if (this.activeModal) {
      this.activeModal.destroy();
      this.activeModal = null;
    }

    // Create a new warning modal with correctly typed options
    const modalButtons: DialogButton[] = [
      {
        label: 'OK',
        variant: 'default' as 'default' | 'outlined' | 'text',
        isPrimary: true,
        closeOnClick: true
      }
    ];

    // Create a new warning modal
    const modalOptions = {
      title: 'Warning',
      modal: true,
      draggable: true,
      resizable: false,
      width: '400px',
      styleClass: 'cka-link-nesting-warning-modal',
      headerClass: 'cka-link-nesting-warning-header',
      contentClass: 'cka-link-nesting-warning-content',
      footerClass: 'cka-link-nesting-warning-footer',
      position: 'center' as 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
      closeOnEscape: true,
      dismissableMask: true,
      showHeader: true,
      buttons: modalButtons
    };

    // Create the modal dialog
    this.activeModal = new CkAlightModalDialog(modalOptions);

    // Set the content
    const content = `
      <div class="cka-link-nesting-warning-icon">
        <i class="fa-regular fa-triangle-exclamation"></i>
      </div>
      <div class="cka-link-nesting-warning-message">
        ${this.warningMessage}
      </div>
    `;
    this.activeModal.setContent(content);

    // Show the modal
    this.activeModal.show();

    // Add an event listener to destroy the modal when closed
    this.activeModal.on('hide', () => {
      if (this.activeModal) {
        setTimeout(() => {
          this.activeModal?.destroy();
          this.activeModal = null;
        }, 300);
      }
    });
  }

  /**
   * Fixes link nesting issues in a specific range
   * 
   * @param writer The model writer
   * @param range The range to check for nested links
   * @returns True if any changes were made
   */
  private _fixLinkNestingInRange(writer: any, range: Range): boolean {
    const linkAttributes = this.linkAttributes;
    let hasChanges = false;
    let nestedLinkDetected = false;

    // Find all text nodes in the range
    const textNodes = Array.from(range.getItems()).filter(item =>
      item.is('$text') && linkAttributes.some(attr => item.hasAttribute(attr))
    );

    // Check for nested links
    for (const node of textNodes) {
      const parentElement = node.parent;

      // Skip non-element parents (should not happen)
      if (!parentElement || !parentElement.is('element')) {
        continue;
      }

      // Check all ancestors for link attributes
      let hasNestedLink = false;
      let ancestor = parentElement;

      while (ancestor && !ancestor.is('rootElement')) {
        // Check if any text node in this ancestor has a link attribute
        // that's different from the current node's link
        const ancestorTextNodes = Array.from(ancestor.getChildren()).filter(
          child => child !== node &&
            child.is('$text') &&
            linkAttributes.some(attr =>
              child.hasAttribute(attr) &&
              // Different link or different attribute
              (node.hasAttribute(attr) ?
                child.getAttribute(attr) !== node.getAttribute(attr) :
                true
              )
            )
        );

        if (ancestorTextNodes.length > 0) {
          hasNestedLink = true;
          nestedLinkDetected = true;
          break;
        }

        // Move up to the next ancestor
        const nextAncestor = ancestor.parent;
        if (!nextAncestor || !nextAncestor.is('element')) {
          break;
        }
        ancestor = nextAncestor;
      }

      // If nested link detected, remove all link attributes
      if (hasNestedLink) {
        for (const attr of linkAttributes) {
          if (node.hasAttribute(attr)) {
            writer.removeAttribute(attr, node);
            hasChanges = true;
          }
        }
      }
    }

    // Show warning dialog if a nested link was detected and removed
    if (nestedLinkDetected) {
      // Use setTimeout to avoid modifying the model during a change block
      setTimeout(() => this._showNestedLinkWarningDialog(), 0);
    }

    return hasChanges;
  }

  /**
   * Listen to link command executions to handle link creation/removal
   */
  private _listenToLinkCommands() {
    const editor = this.editor;
    const commands = editor.commands;

    // Monitor all commands to intercept link-related ones
    for (const [name, command] of commands) {
      // Check if it's a link command (based on naming convention)
      if (name.toLowerCase().includes('link') && name.toLowerCase() !== 'unlink') {
        // Override execute method to handle nesting prevention
        const originalExecute = command.execute;

        command.execute = (...args) => {
          // Process the command execution with nesting prevention
          this._handleLinkCommandExecution(command, originalExecute, args);
        };
      }
    }

    // Also listen for command registration events to catch commands added later
    editor.on('command:register', (evt, commandName, command) => {
      if (commandName.toLowerCase().includes('link') && commandName.toLowerCase() !== 'unlink') {
        const originalExecute = command.execute;

        command.execute = (...args: any[]) => {
          // Process the command execution with nesting prevention
          this._handleLinkCommandExecution(command, originalExecute, args);
        };
      }
    });
  }

  /**
   * Checks if a selection contains or is inside existing links
   * 
   * @param selection The selection to check
   * @returns True if the selection intersects with existing links
   */
  private _selectionHasLinks(selection: Selection | DocumentSelection): boolean {
    const model = this.editor.model;
    const linkAttributes = this.linkAttributes;

    for (const range of selection.getRanges()) {
      // Check if selection contains links
      for (const item of range.getItems()) {
        if (item.is('$text') && linkAttributes.some(attr => item.hasAttribute(attr))) {
          return true;
        }
      }

      // Check if selection is inside a link
      const pos = range.start;
      const posParent = pos.parent;

      if (posParent && posParent.is('$text') &&
        linkAttributes.some(attr => posParent.hasAttribute(attr))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Handle link command execution with automatic nesting prevention
   * 
   * @param command The command being executed
   * @param originalExecute The original execute method
   * @param args Arguments for the execute method
   */
  private _handleLinkCommandExecution(command: any, originalExecute: Function, args: any[]) {
    const editor = this.editor;
    const model = editor.model;
    const selection = model.document.selection;
    const linkAttributes = this.linkAttributes;

    // If selection is collapsed, just execute the original command
    if (selection.isCollapsed) {
      return originalExecute.apply(command, args);
    }

    // Check if we're trying to add a link within an existing link
    const selectionWithinLink = this._checkIfSelectionWithinLink(selection);

    if (selectionWithinLink) {
      // Show warning and don't proceed with the command
      this._showNestedLinkWarningDialog();
      return;
    }

    // For non-collapsed selection, check for existing links
    let hasExistingLinks = false;
    for (const range of selection.getRanges()) {
      for (const item of range.getItems()) {
        if (item.is('$text') && linkAttributes.some(attr => item.hasAttribute(attr))) {
          hasExistingLinks = true;
          break;
        }
      }
      if (hasExistingLinks) break;
    }

    // If selection has existing links, handle replacement automatically
    if (hasExistingLinks) {
      // The first argument is usually the href
      const href = args[0];
      // The second argument is usually options
      const options = args[1] || {};

      // Determine the target attribute name from the command name or options
      let targetAttributeName = '';
      for (const attr of linkAttributes) {
        if (command.name && command.name.toLowerCase().includes(attr.toLowerCase())) {
          targetAttributeName = attr;
          break;
        }
      }

      // If we couldn't determine the attribute name, use command name + 'Href' as fallback
      if (!targetAttributeName && command.name) {
        targetAttributeName = command.name + 'Href';

        // Check if the targetAttributeName is in our linkAttributes list
        if (!linkAttributes.includes(targetAttributeName)) {
          // If not, just use the first one as fallback
          targetAttributeName = linkAttributes[0];
        }
      }

      // Apply the link with automatic replacement
      model.change(writer => {
        // Get valid ranges
        const ranges = model.schema.getValidRanges(
          selection.getRanges(),
          targetAttributeName
        );

        // Process each range
        for (const range of ranges) {
          // Remove all existing link attributes
          for (const attr of linkAttributes) {
            writer.removeAttribute(attr, range);
          }

          // Apply the new link attribute
          writer.setAttribute(targetAttributeName, href, range);

          // Apply additional options if provided
          for (const [key, value] of Object.entries(options)) {
            if (value && typeof value !== 'function') {
              writer.setAttribute(key, value, range);
            }
          }
        }
      });

      // Emit the execute event if the command has a fire method
      if (command.fire) {
        command.fire('execute', { href, options });
      }

      return;
    }

    // If no existing links, just execute the original command
    return originalExecute.apply(command, args);
  }

  /**
   * Check if the current selection is within an existing link
   * 
   * @param selection The current selection
   * @returns True if selection is within an existing link
   */
  private _checkIfSelectionWithinLink(selection: Selection | DocumentSelection): boolean {
    const model = this.editor.model;
    const linkAttributes = this.linkAttributes;

    // Get all selected positions
    const positions = Array.from(selection.getFirstRange()!.getPositions());

    // Check if any position is within a text node that is part of a link
    for (const position of positions) {
      const node = position.textNode;

      if (!node) {
        continue;
      }

      // Check ancestors for link attributes
      let ancestor = node.parent;

      while (ancestor && !ancestor.is('rootElement')) {
        // Check if this ancestor has any text nodes with link attributes
        const textNodesWithLinks = Array.from(ancestor.getChildren()).filter(
          child => child.is('$text') && linkAttributes.some(attr => child.hasAttribute(attr))
        );

        if (textNodesWithLinks.length > 0) {
          return true;
        }

        // Move up to next ancestor
        ancestor = ancestor.parent;
      }
    }

    return false;
  }

  /**
   * Monitor selection changes to handle automatic link expansion
   */
  private _monitorSelectionChanges() {
    const editor = this.editor;
    const model = editor.model;
    const linkAttributes = this.linkAttributes;

    // Expand selection to include the entire link when clicked inside a link
    model.document.on('change:selection', () => {
      const selection = model.document.selection;

      // Only handle collapsed selections (cursor positioning)
      if (!selection.isCollapsed) {
        return;
      }

      // Check if cursor is inside a link
      for (const attr of linkAttributes) {
        if (selection.hasAttribute(attr)) {
          // Get the position
          const position = selection.getFirstPosition();
          if (!position) continue;

          // Find the full link range
          const value = selection.getAttribute(attr);
          const linkRange = findAttributeRange(position, attr, value, model);

          // Check if the selection was made by the user (not programmatically)
          // by looking at the selection change source
          const wasUserSelection = selection.getAttribute('is-selection-change-observer-enabled') !== false;

          // For user selections inside a link, automatically select the entire link
          if (wasUserSelection) {
            model.change(writer => {
              writer.setSelection(linkRange);
            });

            // Exit the loop since we've expanded the selection
            break;
          }
        }
      }
    });
  }

  /**
   * Monitor clipboard operations to prevent nested links during paste
   */
  private _monitorClipboardOperations() {
    const editor = this.editor;
    const linkAttributes = this.linkAttributes;

    // Listen for paste events
    editor.plugins.get('ClipboardPipeline').on('inputTransformation', (evt, data) => {
      if (!data.content || data.content.childCount === 0) {
        return;
      }

      const model = editor.model;
      const selection = model.document.selection;

      // Check if we're pasting inside a link
      let isInsideLink = false;
      let linkAttribute = '';
      let linkValue: any = null;

      for (const attr of linkAttributes) {
        if (selection.hasAttribute(attr)) {
          isInsideLink = true;
          linkAttribute = attr;
          linkValue = selection.getAttribute(attr);
          break;
        }
      }

      // If we're pasting inside a link, handle potential nested links
      if (isInsideLink) {
        // Check if pasted content has links - if so, show warning
        let pastedContentHasLinks = false;
        for (const item of data.content.getChildren()) {
          if (item.is('$text') && linkAttributes.some(attr => item.hasAttribute(attr))) {
            pastedContentHasLinks = true;
            break;
          }
        }

        if (pastedContentHasLinks) {
          setTimeout(() => this._showNestedLinkWarningDialog(), 0);
        }

        model.change(writer => {
          // Get the position
          const position = selection.getFirstPosition();
          if (!position) return;

          // Find the full link range
          const linkRange = findAttributeRange(position, linkAttribute, linkValue, model);

          // Calculate ranges for the split link
          const beforeInsertRange = model.createRange(linkRange.start, position);
          const afterInsertRange = model.createRange(
            position.getShiftedBy(data.content.childCount),
            linkRange.end
          );

          // Keep link attributes on the text before and after the insertion point
          if (!beforeInsertRange.isCollapsed) {
            writer.setAttribute(linkAttribute, linkValue, beforeInsertRange);
          }

          if (!afterInsertRange.isCollapsed) {
            writer.setAttribute(linkAttribute, linkValue, afterInsertRange);
          }

          // Remove all link attributes from the pasted content
          const insertedContentRange = model.createRange(
            position,
            position.getShiftedBy(data.content.childCount)
          );

          for (const attr of linkAttributes) {
            writer.removeAttribute(attr, insertedContentRange);
          }
        });
      }
    });
  }

  /**
   * Static method to find all link attributes from a text node
   * 
   * @param node The text node to check
   * @param linkAttributes Array of possible link attribute names
   * @returns Object with attribute names as keys and their values
   */
  static getLinkAttributesFromNode(node: any, linkAttributes: string[]): Record<string, any> {
    const result: Record<string, any> = {};

    if (node && node.is && node.is('$text')) {
      for (const attr of linkAttributes) {
        if (node.hasAttribute(attr)) {
          result[attr] = node.getAttribute(attr);
        }
      }
    }

    return result;
  }
}
