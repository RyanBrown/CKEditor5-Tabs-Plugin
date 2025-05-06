// src/plugins/alight-predefined-link-plugin/utils/manualdecorator.ts
import { ObservableMixin, type ArrayOrItem } from '@ckeditor/ckeditor5-utils';
import type { MatcherObjectPattern } from '@ckeditor/ckeditor5-engine';

/**
 * Type definition for normalized manual decorator definitions
 */
export interface NormalizedLinkDecoratorManualDefinition {
  id: string;
  label: string;
  attributes?: Record<string, string>;
  classes?: ArrayOrItem<string>;
  styles?: Record<string, string>;
  defaultValue?: boolean;
  mode: 'manual';
}

/**
 * Helper class that stores manual decorators with observable value
 * to support integration with the UI state. An instance of this class is a model with the state of individual manual decorators.
 * These decorators are kept as collections in the link command's manualDecorators.
 */
export default class ManualDecorator extends /* #__PURE__ */ ObservableMixin() {
  /**
   * An ID of a manual decorator which is the name of the attribute in the model, for example: 'linkManualDecorator0'.
   */
  public id: string;

  /**
   * The value of the current manual decorator. It reflects its state from the UI.
   *
   * @observable
   */
  declare public value: boolean | undefined;

  /**
   * The default value of manual decorator.
   */
  public defaultValue?: boolean;

  /**
   * The label used in the user interface to toggle the manual decorator.
   */
  public label: string;

  /**
   * A set of attributes added to downcasted data when the decorator is activated for a specific link.
   * Attributes should be added in a form of attributes defined in ElementDefinition.
   */
  public attributes?: Record<string, string>;

  /**
   * A set of classes added to downcasted data when the decorator is activated for a specific link.
   * Classes should be added in a form of classes defined in ElementDefinition.
   */
  public classes?: ArrayOrItem<string>;

  /**
   * A set of styles added to downcasted data when the decorator is activated for a specific link.
   * Styles should be added in a form of styles defined in ElementDefinition.
   */
  public styles?: Record<string, string>;

  /**
   * Creates a new instance of ManualDecorator.
   *
   * @param config.id The name of the attribute used in the model that represents a given manual decorator.
   * For example: `'linkIsExternal'`.
   * @param config.label The label used in the user interface to toggle the manual decorator.
   * @param config.attributes A set of attributes added to output data when the decorator is active for a specific link.
   * @param [config.defaultValue] Controls whether the decorator is "on" by default.
   */
  constructor({ id, label, attributes, classes, styles, defaultValue }: NormalizedLinkDecoratorManualDefinition) {
    super();

    this.id = id;
    this.set('value', undefined);
    this.defaultValue = defaultValue;
    this.label = label;
    this.attributes = attributes;
    this.classes = classes;
    this.styles = styles;
  }

  /**
   * Returns MatcherPattern with decorator attributes.
   *
   * @internal
   */
  public _createPattern(): MatcherObjectPattern {
    return {
      attributes: this.attributes,
      classes: this.classes,
      styles: this.styles
    };
  }
}
