// src/plugins/alight-prevent-link-nesting-plugin/alight-prevent-link-nesting.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import AlightPreventLinkNestingEditing from './linkediting';
import AlightPreventLinkNestingUI from './linkui';
import './styles/alight-prevent-link-nesting.scss';

/**
 * The prevent link nesting plugin.
 *
 * This is the main plugin that loads the editing and UI components.
 * It follows the same pattern as CKEditor's link plugin.
 */
export default class AlightPreventLinkNesting extends Plugin {
  /**
   * @inheritDoc
   */
  static get pluginName() {
    return 'AlightPreventLinkNesting';
  }

  /**
   * @inheritDoc
   */
  static get requires() {
    return [AlightPreventLinkNestingEditing, AlightPreventLinkNestingUI];
  }
}
