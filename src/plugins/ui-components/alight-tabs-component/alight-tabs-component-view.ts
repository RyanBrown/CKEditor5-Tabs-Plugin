// src/plugins/ui-components/alight-tabs-component/alight-tabs-component-view.ts
import { View, ViewCollection } from '@ckeditor/ckeditor5-ui';
import type { Locale } from '@ckeditor/ckeditor5-utils';
import type { TemplateDefinition } from '@ckeditor/ckeditor5-ui/src/template';
import type { BaseEvent } from '@ckeditor/ckeditor5-utils/src/emittermixin';
import { FocusTracker, KeystrokeHandler } from '@ckeditor/ckeditor5-utils';

export interface TabViewConfig {
  id: string;
  label: string;
  content?: string | View;
  isActive?: boolean;
}

interface TabViewProperties {
  id: string;
  label: string;
  isActive: boolean;
  content: string | View;
  isEnabled: boolean;
}

interface SelectEvent extends BaseEvent {
  name: 'select';
  args: [];
  return: void;
}

export class TabView extends View implements TabViewProperties {
  declare public id: string;
  declare public label: string;
  declare public isActive: boolean;
  declare public content: string | View;
  declare public isEnabled: boolean;

  constructor(locale: Locale, config: TabViewConfig) {
    super(locale);

    this.set('id' as const, config.id);
    this.set('label' as const, config.label);
    this.set('isActive' as const, config.isActive || false);
    this.set('content' as const, config.content || '');
    this.set('isEnabled' as const, true);

    const bind = this.bindTemplate;

    const template: TemplateDefinition = {
      tag: 'li',
      attributes: {
        class: [
          'ck',
          bind.to('isEnabled', value => value ? '' : 'ck-disabled')
        ],
        role: 'tab',
        'aria-selected': bind.to('isActive', String),
        'aria-controls': `cka-tab-content-${this.id}`,
        id: `tab-${this.id}`,
        tabindex: bind.to('isActive', isActive => isActive ? '0' : '-1')
      },
      children: [
        {
          tag: 'button',
          attributes: {
            class: [
              'cka-tab-button',
              bind.to('isActive', value => value ? 'active' : '')
            ]
          },
          children: [
            {
              text: bind.to('label')
            }
          ]
        }
      ],
      on: {
        click: bind.to(() => {
          if (this.isEnabled) {
            this.fire('select');
          }
        }),
        keydown: bind.to((domEvent: Event) => {
          if (!(domEvent instanceof KeyboardEvent)) return;
          if (domEvent.key === ' ' || domEvent.key === 'Enter') {
            domEvent.preventDefault();
            if (this.isEnabled) {
              this.fire('select');
            }
          }
        })
      }
    };

    this.setTemplate(template);
  }

  focus(): void {
    // Fix for TS2339: Property 'focus' does not exist on type 'Element'
    const buttonElement = this.element?.querySelector('.cka-tab-button') as HTMLButtonElement | null;
    if (buttonElement) {
      buttonElement.focus();
    }
  }
}

export class TabPanelView extends View {
  declare public id: string;
  declare public isActive: boolean;

  constructor(locale: Locale, { id, content }: { id: string; content: string | View }) {
    super(locale);

    this.set('id' as const, id);
    this.set('isActive' as const, false);

    const bind = this.bindTemplate;

    const template: TemplateDefinition = {
      tag: 'div',
      attributes: {
        class: [
          'cka-tab-content',
          bind.to('isActive', value => value ? 'active' : '')
        ],
        role: 'tabpanel',
        id: `cka-tab-content-${this.id}`,
        'aria-labelledby': `tab-${this.id}`,
        tabindex: '0'
      },
      children: typeof content === 'string' ? [{ text: content }] : [content]
    };

    this.setTemplate(template);
  }
}

export class TabsView extends View {
  public readonly tabsCollection: ViewCollection<TabView>;
  public readonly panelsCollection: ViewCollection<TabPanelView>;
  public readonly focusTracker: FocusTracker;
  public readonly keystrokes: KeystrokeHandler;
  private _focusableTab: TabView | null = null;
  private _scrollableHeader: boolean = false;

  constructor(locale: Locale, config: { tabs: TabViewConfig[]; scrollable?: boolean }) {
    super(locale);

    this.tabsCollection = new ViewCollection();
    this.panelsCollection = new ViewCollection();
    this.focusTracker = new FocusTracker();
    this.keystrokes = new KeystrokeHandler();
    this._scrollableHeader = config.scrollable || false;

    const template: TemplateDefinition = {
      tag: 'div',
      attributes: {
        class: [
          'cka-tabs'
        ]
      },
      children: [
        {
          tag: 'div',
          attributes: {
            class: [
              'cka-tabs-header',
              this._scrollableHeader ? 'scrollable' : ''
            ],
            role: 'tablist'
          },
          children: [
            ...(this._scrollableHeader ? [
              {
                tag: 'button',
                attributes: {
                  class: ['cka-scroll-button', 'left'],
                  'aria-label': 'Scroll left'
                },
                children: [{
                  text: '‹'
                }],
                on: {
                  click: this._handleScrollLeft.bind(this)
                }
              }
            ] : []),
            {
              tag: 'ul',
              attributes: {
                class: ['cka-tabs-list']
              },
              children: this.tabsCollection
            },
            ...(this._scrollableHeader ? [
              {
                tag: 'button',
                attributes: {
                  class: ['cka-scroll-button', 'right'],
                  'aria-label': 'Scroll right'
                },
                children: [{
                  text: '›'
                }],
                on: {
                  click: this._handleScrollRight.bind(this)
                }
              }
            ] : [])
          ]
        },
        ...this.panelsCollection
      ]
    };

    this.setTemplate(template);

    this._createTabs(config.tabs);
    this._setUpKeyboardNavigation();
  }

  private _handleScrollLeft(): void {
    const tabsList = this.element?.querySelector('.cka-tabs-list') as HTMLElement;
    if (tabsList) {
      tabsList.scrollLeft -= 100;
    }
  }

  private _handleScrollRight(): void {
    const tabsList = this.element?.querySelector('.cka-tabs-list') as HTMLElement;
    if (tabsList) {
      tabsList.scrollLeft += 100;
    }
  }

  // Creates tabs from configuration
  private _createTabs(tabConfigs: TabViewConfig[]): void {
    for (const config of tabConfigs) {
      const tabView = new TabView(this.locale as Locale, config);
      const panelView = new TabPanelView(this.locale as Locale, {
        id: config.id,
        content: config.content || ''
      });

      tabView.on<SelectEvent>('select', () => {
        this._selectTab(tabView);
      });

      this.tabsCollection.add(tabView);
      this.panelsCollection.add(panelView);

      if (config.isActive) {
        this._selectTab(tabView);
      }
    }

    // If no tab is active, select the first one
    if (!this._focusableTab && this.tabsCollection.length) {
      this._selectTab(this.tabsCollection.first!);
    }
  }

  private _selectTab(tabView: TabView): void {
    // Deactivate all tabs and panels
    for (const tab of this.tabsCollection) {
      tab.set('isActive' as const, false);
    }
    for (const panel of this.panelsCollection) {
      panel.set('isActive' as const, false);
    }

    // Activate the selected tab and its panel
    tabView.set('isActive' as const, true);
    const panelIndex = this.tabsCollection.getIndex(tabView);
    if (panelIndex !== -1) {
      this.panelsCollection.get(panelIndex)?.set('isActive' as const, true);
    }

    this._focusableTab = tabView;
    const event: BaseEvent = { name: 'select' as const, args: [] };
    this.fire('select', event, tabView);
  }

  private _setUpKeyboardNavigation(): void {
    const handleArrowKeys = (direction: 'previous' | 'next'): void => {
      const currentIndex = this._focusableTab ?
        this.tabsCollection.getIndex(this._focusableTab) : -1;

      let newIndex: number;
      if (direction === 'next') {
        newIndex = currentIndex + 1;
        if (newIndex >= this.tabsCollection.length) {
          newIndex = 0;
        }
      } else {
        newIndex = currentIndex - 1;
        if (newIndex < 0) {
          newIndex = this.tabsCollection.length - 1;
        }
      }

      const newTab = this.tabsCollection.get(newIndex);
      if (newTab?.isEnabled) {
        this._selectTab(newTab);
        newTab.focus();
      }
    };

    this.keystrokes.set('arrowright', () => handleArrowKeys('next'));
    this.keystrokes.set('arrowleft', () => handleArrowKeys('previous'));
    this.keystrokes.set('home', () => {
      const firstTab = this.tabsCollection.find(tab => tab.isEnabled);
      if (firstTab) {
        this._selectTab(firstTab);
        firstTab.focus();
      }
    });
    this.keystrokes.set('end', () => {
      const lastTab = [...this.tabsCollection].reverse().find(tab => tab.isEnabled);
      if (lastTab) {
        this._selectTab(lastTab);
        lastTab.focus();
      }
    });
  }

  override render(): void {
    super.render();

    // Set up focus tracking
    for (const tab of this.tabsCollection) {
      const buttonElement = tab.element?.querySelector('.cka-tab-button');
      if (buttonElement) {
        this.focusTracker.add(buttonElement);
      }
    }
    for (const panel of this.panelsCollection) {
      this.focusTracker.add(panel.element!);
    }

    this.keystrokes.listenTo(this.element!);
  }

  focus(): void {
    this._focusableTab?.focus();
  }

  override destroy(): void {
    super.destroy();
    this.focusTracker.destroy();
    this.keystrokes.destroy();
  }
}
