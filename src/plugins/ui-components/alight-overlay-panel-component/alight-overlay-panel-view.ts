// src/plugins/ui-components/alight-overlay-panel-component/alight-overlay-panel-view.ts
import { View } from '@ckeditor/ckeditor5-ui';
import { global } from '@ckeditor/ckeditor5-utils';
import type { Locale } from '@ckeditor/ckeditor5-utils';
import type { TemplateDefinition } from '@ckeditor/ckeditor5-ui/src/template';
import type { BaseEvent } from '@ckeditor/ckeditor5-utils/src/emittermixin';
import { AlightUIBaseComponent } from '../alight-ui-base-component/alight-ui-base-component';

export type PanelPosition = 'top' | 'bottom' | 'left' | 'right' | 'auto';

export interface OverlayPanelPosition {
  targetElement: HTMLElement;
  position?: PanelPosition;
  offset?: { x: number; y: number };
}

interface OverlayPanelProperties {
  isVisible: boolean;
  position: PanelPosition;
}

interface PropertyChangeEvent extends BaseEvent {
  name: 'change:isVisible' | 'change:position';
  args: [evt: BaseEvent, propertyName: string, value: boolean | PanelPosition];
  return: void;
}

export class OverlayPanelView extends AlightUIBaseComponent implements OverlayPanelProperties {
  declare public isVisible: boolean;
  declare public position: PanelPosition;
  public readonly contentView: View;

  private _targetElement: HTMLElement | null = null;
  private _positionOffset: { x: number; y: number } = { x: 0, y: 0 };
  private readonly _clickOutsideHandler: (event: MouseEvent) => void;
  private readonly _windowResizeHandler: () => void;

  constructor(locale: Locale) {
    super(locale);

    const bind = this.bindTemplate;

    // Initialize observable properties
    this.set('isVisible' as const, false);
    this.set('position' as const, 'auto');

    // Create content view container
    this.contentView = new View(locale);
    this.contentView.setTemplate({
      tag: 'div',
      attributes: {
        class: [
          'ck',
          'ck-alight-overlay-panel__content'
        ]
      }
    });

    // Bind handlers
    this._clickOutsideHandler = this._handleClickOutside.bind(this);
    this._windowResizeHandler = this._handleWindowResize.bind(this);

    const template: TemplateDefinition = {
      tag: 'div',
      attributes: {
        class: [
          'ck',
          'ck-alight-overlay-panel',
          bind.to('isVisible', (value: boolean) => value ? 'ck-alight-overlay-panel--visible' : ''),
          bind.to('position', (value: PanelPosition) => `ck-alight-overlay-panel--${value}`)
        ],
        tabindex: '-1'
      },
      children: [
        this.contentView
      ]
    };

    this.setTemplate(template);

    // Listen for isVisible changes to manage event listeners
    this.on<PropertyChangeEvent>('change:isVisible', (_evt, _propertyName, value) => {
      if (value) {
        this._addListeners();
      } else {
        this._removeListeners();
      }
    });
  }

  // @inheritdoc
  override render(): void {
    super.render();

    // Initial position update if panel is visible
    if (this.isVisible && this._targetElement) {
      this._updatePosition();
    }
  }

  // Shows the overlay panel.
  show(config: OverlayPanelPosition): void {
    this._targetElement = config.targetElement;
    this.set('position' as const, config.position || 'auto');
    this._positionOffset = config.offset || { x: 0, y: 0 };

    this.set('isVisible' as const, true);
    this._updatePosition();
  }

  // Hides the overlay panel.
  hide(): void {
    this.set('isVisible' as const, false);
  }

  // Updates the content of the panel.
  setContent(content: string | View): void {
    this.contentView.setTemplate({
      tag: 'div',
      attributes: {
        class: [
          'ck',
          'ck-alight-overlay-panel__content'
        ]
      },
      children: typeof content === 'string' ? [{ text: content }] : [content]
    });

    // Re-render the content view if already rendered
    if (this.contentView.element) {
      this.contentView.render();
    }
  }

  // Calculates and updates the panel position.
  private _updatePosition(): void {
    if (!this._targetElement || !this.element) {
      return;
    }

    const panelRect = this.element.getBoundingClientRect();
    const targetRect = this._targetElement.getBoundingClientRect();
    const viewportHeight = global.window.innerHeight;
    const viewportWidth = global.window.innerWidth;

    let top: number;
    let left: number;
    let position = this.position;

    // Auto-position logic
    if (position === 'auto') {
      position = this._calculateAutoPosition(panelRect, targetRect, viewportHeight, viewportWidth);
    }

    const coordinates = this._calculateCoordinates(position, panelRect, targetRect);
    top = coordinates.top + this._positionOffset.y;
    left = coordinates.left + this._positionOffset.x;

    // Ensure the panel stays within viewport bounds
    top = Math.max(0, Math.min(top, viewportHeight - panelRect.height));
    left = Math.max(0, Math.min(left, viewportWidth - panelRect.width));

    // Update position and class
    this.element.style.top = `${top}px`;
    this.element.style.left = `${left}px`;
    this.set('position' as const, position);
  }

  private _calculateAutoPosition(
    panelRect: DOMRect,
    targetRect: DOMRect,
    viewportHeight: number,
    viewportWidth: number
  ): PanelPosition {
    if (targetRect.bottom + panelRect.height <= viewportHeight) {
      return 'bottom';
    }
    if (targetRect.top - panelRect.height >= 0) {
      return 'top';
    }
    if (targetRect.right + panelRect.width <= viewportWidth) {
      return 'right';
    }
    if (targetRect.left - panelRect.width >= 0) {
      return 'left';
    }
    return 'bottom';
  }

  private _calculateCoordinates(
    position: PanelPosition,
    panelRect: DOMRect,
    targetRect: DOMRect
  ): { top: number; left: number } {
    switch (position) {
      case 'top':
        return {
          top: targetRect.top - panelRect.height,
          left: targetRect.left + (targetRect.width - panelRect.width) / 2
        };
      case 'bottom':
        return {
          top: targetRect.bottom,
          left: targetRect.left + (targetRect.width - panelRect.width) / 2
        };
      case 'left':
        return {
          top: targetRect.top + (targetRect.height - panelRect.height) / 2,
          left: targetRect.left - panelRect.width
        };
      case 'right':
        return {
          top: targetRect.top + (targetRect.height - panelRect.height) / 2,
          left: targetRect.right
        };
      default:
        return {
          top: targetRect.bottom,
          left: targetRect.left
        };
    }
  }

  // Handles clicks outside the panel.
  private _handleClickOutside(event: MouseEvent): void {
    const clickedElement = event.target as HTMLElement;
    const isClickInside = this.element?.contains(clickedElement);
    const isClickOnTarget = this._targetElement?.contains(clickedElement);

    if (!isClickInside && !isClickOnTarget) {
      this.hide();
    }
  }

  // Handles window resize events.
  private _handleWindowResize(): void {
    if (this.isVisible) {
      this._updatePosition();
    }
  }

  // Adds document event listeners.
  private _addListeners(): void {
    global.document.addEventListener('mousedown', this._clickOutsideHandler);
    global.window.addEventListener('resize', this._windowResizeHandler);
    global.window.addEventListener('scroll', this._windowResizeHandler, true);
  }

  // Removes document event listeners.
  private _removeListeners(): void {
    global.document.removeEventListener('mousedown', this._clickOutsideHandler);
    global.window.removeEventListener('resize', this._windowResizeHandler);
    global.window.removeEventListener('scroll', this._windowResizeHandler, true);
  }

  // @inheritdoc
  override destroy(): void {
    this._removeListeners();
    super.destroy();
  }
}