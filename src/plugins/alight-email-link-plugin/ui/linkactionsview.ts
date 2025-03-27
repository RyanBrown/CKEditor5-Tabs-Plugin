// src/plugins/alight-email-link-plugin/ui/linkactionsview.ts
import { ButtonView, View, ViewCollection, FocusCycler, type FocusableView } from 'ckeditor5/src/ui';
import { FocusTracker, KeystrokeHandler, type LocaleTranslate, type Locale } from 'ckeditor5/src/utils';
import { icons } from 'ckeditor5/src/core';

import { ensureSafeUrl, extractEmail } from '../utils';

// See: #8833.
// eslint-disable-next-line ckeditor5-rules/ckeditor-imports
import '@ckeditor/ckeditor5-ui/theme/components/responsive-form/responsiveform.css';
import '@ckeditor/ckeditor5-link/theme/linkactions.css';

import unlinkIcon from '@ckeditor/ckeditor5-link/theme/icons/unlink.svg';

/**
 * The link actions view class. This view displays the link preview, allows
 * unlinking or editing the link.
 */
export default class LinkActionsView extends View {
  /**
   * Tracks information about DOM focus in the actions.
   */
  public readonly focusTracker = new FocusTracker();

  /**
   * An instance of the {@link module:utils/keystrokehandler~KeystrokeHandler}.
   */
  public readonly keystrokes = new KeystrokeHandler();

  /**
   * The href preview view.
   */
  public previewButtonView: ButtonView;

  /**
   * The unlink button view.
   */
  public unlinkButtonView: ButtonView;

  /**
   * The edit link button view.
   */
  public editButtonView: ButtonView;

  /**
   * The value of the "href" attribute of the link to use in the {@link #previewButtonView}.
   *
   * @observable
   */
  declare public href: string | undefined;

  /**
   * The organization name associated with the link, if any.
   * 
   * @observable
   */
  declare public organization: string | undefined;

  /**
   * A collection of views that can be focused in the view.
   */
  private readonly _focusables = new ViewCollection<FocusableView>();

  /**
   * Helps cycling over {@link #_focusables} in the view.
   */
  private readonly _focusCycler: FocusCycler;

  declare public t: LocaleTranslate;

  /**
   * @inheritDoc
   */
  constructor(locale: Locale) {
    super(locale);

    const t = locale.t;

    // Initialize observable properties
    this.set({
      href: undefined,
      organization: undefined
    });

    // Create buttons
    this.unlinkButtonView = this._createButton(t('Unlink'), unlinkIcon, 'unlink');
    this.editButtonView = this._createButton(t('Edit link'), icons.pencil, 'edit');
    this.previewButtonView = this._createPreviewButton();

    // Listen for property changes to update button label
    this.on('change:href', () => {
      this._updateButtonLabel();
    });

    this.on('change:organization', () => {
      this._updateButtonLabel();
    });

    // Initialize the button label
    this._updateButtonLabel();

    this._focusCycler = new FocusCycler({
      focusables: this._focusables,
      focusTracker: this.focusTracker,
      keystrokeHandler: this.keystrokes,
      actions: {
        // Navigate fields backwards using the Shift + Tab keystroke.
        focusPrevious: 'shift + tab',
        // Navigate fields forwards using the Tab key.
        focusNext: 'tab'
      }
    });

    this.setTemplate({
      tag: 'div',
      attributes: {
        class: [
          'ck',
          'ck-link-actions',
          'ck-responsive-form'
        ],
        // https://github.com/ckeditor/ckeditor5-link/issues/90
        tabindex: '-1'
      },
      children: [
        this.previewButtonView,
        this.editButtonView,
        this.unlinkButtonView
      ]
    });
  }

  /**
   * @inheritDoc
   */
  public override render(): void {
    super.render();

    const childViews = [
      this.previewButtonView,
      this.editButtonView,
      this.unlinkButtonView
    ];

    childViews.forEach(v => {
      // Register the view as focusable.
      this._focusables.add(v);

      // Register the view in the focus tracker.
      this.focusTracker.add(v.element!);
    });

    // Start listening for the keystrokes coming from #element.
    this.keystrokes.listenTo(this.element!);
  }

  /**
   * @inheritDoc
   */
  public override destroy(): void {
    super.destroy();

    this.focusTracker.destroy();
    this.keystrokes.destroy();
  }

  /**
   * Focuses the fist {@link #_focusables} in the actions.
   */
  public focus(): void {
    this._focusCycler.focusFirst();
  }

  /**
   * Updates the label of the preview button based on the current href and organization
   */
  private _updateButtonLabel(): void {
    const href = this.href;
    const organization = this.organization;
    const t = this.t;

    // Create a display label that includes organization if available
    let displayText = '';

    // Start with the email address (without mailto: prefix)
    if (href) {
      displayText = href.startsWith('mailto:') ? extractEmail(href) : href;
    } else {
      this.previewButtonView.label = t('This link has no URL');
      return;
    }

    // Add organization if available
    if (organization) {
      displayText += ` (${organization})`;
    }

    this.previewButtonView.label = displayText;
  }

  /**
   * Creates a button view.
   *
   * @param label The button label.
   * @param icon The button icon.
   * @param eventName An event name that the `ButtonView#execute` event will be delegated to.
   * @returns The button view instance.
   */
  private _createButton(label: string, icon: string, eventName?: string): ButtonView {
    const button = new ButtonView(this.locale);

    button.set({
      label,
      icon,
      tooltip: true
    });

    button.delegate('execute').to(this, eventName);

    return button;
  }

  /**
   * Creates a link href preview button.
   *
   * @returns The button view instance.
   */
  private _createPreviewButton(): ButtonView {
    const button = new ButtonView(this.locale);
    const bind = this.bindTemplate;
    const t = this.t!;

    button.set({
      withText: true,
      tooltip: t('Open email link')
    });

    button.extendTemplate({
      attributes: {
        class: [
          'ck',
          'ck-link-actions__preview'
        ],
        href: bind.to('href', href => href && ensureSafeUrl(href)),
        target: '_blank',
        rel: 'noopener noreferrer'
      },
    });

    button.bind('isEnabled').to(this, 'href', href => !!href);

    button.template!.tag = 'a';

    return button;
  }
}

/**
 * Fired when the {@link ~LinkActionsView#editButtonView} is clicked.
 *
 * @eventName ~LinkActionsView#edit
 */
export type EditEvent = {
  name: 'edit';
  args: [];
};

/**
 * Fired when the {@link ~LinkActionsView#unlinkButtonView} is clicked.
 *
 * @eventName ~LinkActionsView#unlink
 */
export type UnlinkEvent = {
  name: 'unlink';
  args: [];
};

/**
 * The options that are passed to the {@link ~LinkActionsView#constructor} constructor.
 */
export type LinkActionsViewOptions = {
  /**
   * Returns `true` when bookmark `id` matches the hash from `link`.
   */
  isScrollableToTarget: (href: string | undefined) => boolean;

  /**
   * Scrolls the view to the desired bookmark or open a link in new window.
   */
  scrollToTarget: (href: string) => void;
};