// src/plugins/alight-prevent-link-nesting-plugin/linkediting.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { findAttributeRange } from '@ckeditor/ckeditor5-typing';
import type { Range, Selection, DocumentSelection } from '@ckeditor/ckeditor5-engine';
import type { Editor } from '@ckeditor/ckeditor5-core';
import { isNodeInsideLink } from './utils';

/**
 * The prevent link nesting editing feature.
 */
export default class AlightPreventLinkNestingEditing extends Plugin {
  /**
   * Array of link attribute names to monitor
   */
  private _linkAttributes: string[] = [];

  /**
   * Option to merge overlapping links
   */
  private _mergeOverlappingLinks: boolean = true;

  /**
   * @inheritDoc
   */
  static get pluginName() {
    return 'AlightPreventLinkNestingEditing';
  }

  /**
   * @inheritDoc
   */
  init() {
    const editor = this.editor;

    // Load configuration
    const config = editor.config.get('preventLinkNesting');

    // Configure link attributes to monitor
    if (config?.linkAttributes?.length) {
      this._linkAttributes = config.linkAttributes;
    } else {
      this._linkAttributes = [
        'linkHref',
        'alightExternalLinkPluginHref',
        'alightPredefinedLinkPluginHref',
        'alightEmailLinkPluginHref',
        'alightExistingDocumentLinkPluginHref',
        'alightNewDocumentLinkPluginHref'
      ];
    }

    // Set merge option
    if (config?.mergeOverlappingLinks !== undefined) {
      this._mergeOverlappingLinks = config.mergeOverlappingLinks;
    }

    this._addLinkNestingRestrictions();
    this._registerPostFixers();
    this._listenToLinkCommands();
    this._monitorSelectionChanges();
    this._monitorClipboardOperations();
  }

  /**
   * Add link nesting restrictions to the schema
   */
  private _addLinkNestingRestrictions() {
    const editor = this.editor;
    const schema = editor.model.schema;
    const linkAttributes = this._linkAttributes;

    for (const attributeName of linkAttributes) {
      schema.addAttributeCheck((context, attributeToCheck) => {
        if (!linkAttributes.includes(attributeToCheck)) {
          return true;
        }

        const node = context.getItem(0);
        if (!node) {
          return true;
        }

        const ancestors = [];
        ancestors.push(node);

        type NodeWithParent = { parent?: any };
        const modelNode = node as NodeWithParent;

        if (modelNode && modelNode.parent) {
          let parentNode = modelNode.parent as NodeWithParent;
          while (parentNode) {
            ancestors.push(parentNode);
            parentNode = parentNode.parent;
          }
        }

        return !ancestors.some(ancestor => {
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
    const linkAttributes = this._linkAttributes;

    model.document.registerPostFixer(writer => {
      let hasChanges = false;
      const changes = model.document.differ.getChanges();

      for (const change of changes) {
        if (change.type === 'insert' ||
          (change.type === 'attribute' && linkAttributes.includes(change.attributeKey))) {

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
    const linkAttributes = this._linkAttributes;
    let hasChanges = false;

    if (change.type === 'insert') {
      const range = model.createRange(
        change.position,
        change.position.getShiftedBy(change.length)
      );

      hasChanges = this._fixLinkNestingInRange(writer, range);
    } else if (change.type === 'attribute' && linkAttributes.includes(change.attributeKey)) {
      hasChanges = this._fixLinkNestingInRange(writer, change.range);

      if (this._hasMultipleLinkAttributes(change.range)) {
        hasChanges = this._removeOtherLinkAttributes(writer, change.range, change.attributeKey) || hasChanges;
      }
    }

    return hasChanges;
  }

  /**
   * Checks if a range has multiple link attributes
   */
  private _hasMultipleLinkAttributes(range: Range): boolean {
    const linkAttributes = this._linkAttributes;

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
   */
  private _removeOtherLinkAttributes(writer: any, range: Range, keepAttribute: string): boolean {
    const linkAttributes = this._linkAttributes;
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
   * Fixes link nesting issues in a specific range
   */
  private _fixLinkNestingInRange(writer: any, range: Range): boolean {
    const linkAttributes = this._linkAttributes;
    let hasChanges = false;
    let nestedLinkDetected = false;

    // Find all text nodes in the range
    const textNodes = Array.from(range.getItems()).filter(item =>
      item.is('$text') && linkAttributes.some(attr => item.hasAttribute(attr))
    );

    // Check for nested links
    for (const node of textNodes) {
      const parentElement = node.parent;

      if (!parentElement || !parentElement.is('element')) {
        continue;
      }

      let hasNestedLink = false;
      let ancestor = parentElement;

      while (ancestor && !ancestor.is('rootElement')) {
        const ancestorTextNodes = Array.from(ancestor.getChildren()).filter(
          child => child !== node &&
            child.is('$text') &&
            linkAttributes.some(attr =>
              child.hasAttribute(attr) &&
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

        const nextAncestor = ancestor.parent;
        if (!nextAncestor || !nextAncestor.is('element')) {
          break;
        }
        ancestor = nextAncestor;
      }

      if (hasNestedLink) {
        for (const attr of linkAttributes) {
          if (node.hasAttribute(attr)) {
            writer.removeAttribute(attr, node);
            hasChanges = true;
          }
        }
      }
    }

    if (nestedLinkDetected) {
      setTimeout(() => this._emitNestingWarning(), 0);
    }

    return hasChanges;
  }

  /**
   * Listen to link command executions to handle link creation/removal
   */
  private _listenToLinkCommands() {
    const editor = this.editor;
    const commands = editor.commands;

    for (const [name, command] of commands) {
      if (name.toLowerCase().includes('link') && name.toLowerCase() !== 'unlink') {
        const originalExecute = command.execute;

        command.execute = (...args) => {
          this._handleLinkCommandExecution(command, originalExecute, args);
        };
      }
    }

    editor.on('command:register', (evt, commandName, command) => {
      if (commandName.toLowerCase().includes('link') && commandName.toLowerCase() !== 'unlink') {
        const originalExecute = command.execute;

        command.execute = (...args: any[]) => {
          this._handleLinkCommandExecution(command, originalExecute, args);
        };
      }
    });
  }

  /**
   * Handle link command execution with automatic nesting prevention
   */
  private _handleLinkCommandExecution(command: any, originalExecute: Function, args: any[]) {
    const editor = this.editor;
    const model = editor.model;
    const selection = model.document.selection;
    const linkAttributes = this._linkAttributes;

    if (selection.isCollapsed) {
      return originalExecute.apply(command, args);
    }

    const selectionWithinLink = this._checkIfSelectionWithinLink(selection);

    if (selectionWithinLink) {
      this._emitNestingWarning();
      return;
    }

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

    if (hasExistingLinks) {
      const href = args[0];
      const options = args[1] || {};

      let targetAttributeName = '';
      for (const attr of linkAttributes) {
        if (command.name && command.name.toLowerCase().includes(attr.toLowerCase())) {
          targetAttributeName = attr;
          break;
        }
      }

      if (!targetAttributeName && command.name) {
        targetAttributeName = command.name + 'Href';

        if (!linkAttributes.includes(targetAttributeName)) {
          targetAttributeName = linkAttributes[0];
        }
      }

      model.change(writer => {
        const ranges = model.schema.getValidRanges(
          selection.getRanges(),
          targetAttributeName
        );

        for (const range of ranges) {
          for (const attr of linkAttributes) {
            writer.removeAttribute(attr, range);
          }

          writer.setAttribute(targetAttributeName, href, range);

          for (const [key, value] of Object.entries(options)) {
            if (value && typeof value !== 'function') {
              writer.setAttribute(key, value, range);
            }
          }
        }
      });

      if (command.fire) {
        command.fire('execute', { href, options });
      }

      return;
    }

    return originalExecute.apply(command, args);
  }

  /**
   * Check if the current selection is within an existing link
   */
  private _checkIfSelectionWithinLink(selection: Selection | DocumentSelection): boolean {
    const positions = Array.from(selection.getFirstRange()!.getPositions());

    for (const position of positions) {
      const node = position.textNode;
      if (node && isNodeInsideLink(node, this._linkAttributes)) {
        return true;
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
    const linkAttributes = this._linkAttributes;

    model.document.on('change:selection', () => {
      const selection = model.document.selection;

      if (!selection.isCollapsed) {
        return;
      }

      for (const attr of linkAttributes) {
        if (selection.hasAttribute(attr)) {
          const position = selection.getFirstPosition();
          if (!position) continue;

          const value = selection.getAttribute(attr);
          const linkRange = findAttributeRange(position, attr, value, model);

          const wasUserSelection = selection.getAttribute('is-selection-change-observer-enabled') !== false;

          if (wasUserSelection) {
            model.change(writer => {
              writer.setSelection(linkRange);
            });
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
    const linkAttributes = this._linkAttributes;

    editor.plugins.get('ClipboardPipeline').on('inputTransformation', (evt, data) => {
      if (!data.content || data.content.childCount === 0) {
        return;
      }

      const model = editor.model;
      const selection = model.document.selection;

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

      if (isInsideLink) {
        let pastedContentHasLinks = false;
        for (const item of data.content.getChildren()) {
          if (item.is('$text') && linkAttributes.some(attr => item.hasAttribute(attr))) {
            pastedContentHasLinks = true;
            break;
          }
        }

        if (pastedContentHasLinks) {
          setTimeout(() => this._emitNestingWarning(), 0);
        }

        model.change(writer => {
          const position = selection.getFirstPosition();
          if (!position) return;

          const linkRange = findAttributeRange(position, linkAttribute, linkValue, model);

          const beforeInsertRange = model.createRange(linkRange.start, position);
          const afterInsertRange = model.createRange(
            position.getShiftedBy(data.content.childCount),
            linkRange.end
          );

          if (!beforeInsertRange.isCollapsed) {
            writer.setAttribute(linkAttribute, linkValue, beforeInsertRange);
          }

          if (!afterInsertRange.isCollapsed) {
            writer.setAttribute(linkAttribute, linkValue, afterInsertRange);
          }

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
   * Fires an event to show warning dialog when link nesting is detected
   */
  _emitNestingWarning() {
    this.fire('linkNestingDetected');
  }
}
