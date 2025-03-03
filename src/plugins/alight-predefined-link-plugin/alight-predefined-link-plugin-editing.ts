// src/plugins/alight-predefined-link-plugin/alight-predefined-link-plugin-editing.ts
import { Plugin, Editor } from '@ckeditor/ckeditor5-core';
import { Link } from '@ckeditor/ckeditor5-link';
import { predefinedLinkRegistry } from './alight-predefined-link-plugin-registry';

/**
 * A plugin that adds classes and data attributes to predefined links without
 * interfering with the core link functionality.
 */
export default class AlightPredefinedLinkPluginEditing extends Plugin {
  constructor(editor: Editor) {
    super(editor);
  }

  public static get pluginName() {
    return 'AlightPredefinedLinkPluginEditing' as const;
  }

  public static get requires() {
    // We require the built-in Link plugin so we can extend its linkHref logic.
    return [Link] as const;
  }

  public init(): void {
    try {
      // Add a downcast dispatcher to apply predefined link styling without overriding basic link functionality
      this._setupDowncastDispatcher();
    } catch (e) {
      console.error('Error initializing predefined link editing', e);
    }
  }

  /**
   * Set up a post-fixer for the downcast conversion to add predefined link classes
   * to links that match entries in our registry.
   */
  private _setupDowncastDispatcher(): void {
    try {
      const editor = this.editor;
      const registry = predefinedLinkRegistry.getRegistry();

      // Add a dispatcher for link rendering with defensive checks
      editor.editing.downcastDispatcher.on('attribute:linkHref', (evt, data, conversionApi) => {
        try {
          // This is non-intrusive - we're just adding to the conversion, not replacing it
          const { writer, mapper } = conversionApi;

          // Get the model range
          const modelRange = data.range;

          // Map model to view
          const viewRange = mapper.toViewRange(modelRange);

          // Get the URL from the data
          const url = data.attributeNewValue;

          // Only proceed if we have a URL and it exists in our registry
          if (!url || !registry.has(url)) {
            return;
          }

          // Get predefined link metadata
          const linkData = registry.get(url);
          if (!linkData) {
            return;
          }

          // Find all <a> elements in this range
          const walker = viewRange.getWalker({ shallow: true });

          for (const { item } of walker) {
            if (item && item.is && item.is('element', 'a')) {
              // Add our class to identify this as a predefined link
              writer.addClass('predefined-link', item);

              // Add data attributes for predefined link metadata
              writer.setAttribute('data-predefined-name', linkData.name || '', item);
              writer.setAttribute('data-predefined-description', linkData.description || '', item);
              writer.setAttribute('data-predefined-id', linkData.id || '', item);
            }
          }
        } catch (e) {
          console.warn('Error in predefined link downcast conversion', e);
        }
      }, { priority: 'low' }); // Low priority so it runs after the default link conversion
    } catch (e) {
      console.error('Error setting up downcast dispatcher', e);
    }
  }
}