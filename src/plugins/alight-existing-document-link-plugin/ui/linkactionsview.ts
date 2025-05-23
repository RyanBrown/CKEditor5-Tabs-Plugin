// src/plugins/alight-existing-document-link/ui/linkactionsview.ts
import { ButtonView, View, ViewCollection, FocusCycler, type FocusableView } from 'ckeditor5/src/ui';
import { FocusTracker, KeystrokeHandler, type LocaleTranslate, type Locale } from 'ckeditor5/src/utils';
import { icons } from 'ckeditor5/src/core';
import { isExistingDocumentLink, extractExternalDocumentLinkId } from '../utils';
import type { DocumentLink } from './linkmodal-modal-types';

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
  public previewButtonView: View;

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
   * Available document links for lookup.
   * This can be set from outside to enable lookup of link details.
   */
  private _documentLinks: DocumentLink[] = [];

  /**
   * A collection of views that can be focused in the view.
   */
  private readonly _focusables = new ViewCollection<FocusableView>();

  /**
   * Helps cycling over {@link #_focusables} in the view.
   */
  private readonly _focusCycler: FocusCycler;

  /**
   * @inheritDoc
   */
  constructor(locale: Locale) {
    super(locale);

    const t = locale.t;

    // IMPORTANT: Set observable properties BEFORE creating buttons
    // This fixes the binding error
    this.set({
      href: undefined
    });

    this.previewButtonView = this._createPreviewButton();
    this.unlinkButtonView = this._createButton(t('Unlink'), unlinkIcon, 'unlink');
    this.editButtonView = this._createButton(t('Edit link'), icons.pencil, 'edit');

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
        class: ['ck', 'ck-link-actions', 'ck-responsive-form'],
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
   * Sets the available document links for lookup.
   * 
   * @param links The document links array
   */
  public setDocumentLinks(links: DocumentLink[]): void {
    this._documentLinks = links;
  }

  /**
   * Finds document link data based on the href
   * 
   * @param href The link href/URL
   * @returns The document link or null if not found
   */
  private _findDocumentLink(href: string | undefined): DocumentLink | null {
    if (!href || !this._documentLinks || this._documentLinks.length === 0) {
      return null;
    }

    // Extract the link ID if this is an existing document link
    const linkId = extractExternalDocumentLinkId(href);
    if (!linkId) {
      return null;
    }

    // Try to find the link by ID or by destination
    return this._documentLinks.find(link => {
      // Match by serverFilePath
      if (link.serverFilePath === linkId) {
        return true;
      }

      // Match by fileId
      if (link.fileId === linkId) {
        return true;
      }

      // Match by serverFilePath that contains the ID
      if (link.serverFilePath && link.serverFilePath.includes(linkId)) {
        return true;
      }

      return false;
    }) || null;
  }

  /**
   * @inheritDoc
   */
  public override render(): void {
    super.render();

    const childViews = [
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
   * Creates a custom view for the link title display.
   *
   * @returns The custom view instance.
   */
  private _createPreviewButton(): View {
    // Create a custom view instead of using ButtonView
    const customView = new View(this.locale);
    const bind = this.bindTemplate;
    const t = this.locale.t;

    // Set up the template for a simple div with your custom class
    customView.setTemplate({
      tag: 'div',
      attributes: {
        class: ['ck', 'cka-button-title']
      },
      children: [{
        tag: 'span',
        attributes: {
          class: ['ck', 'ck-button__label', 'cka-button-title-text']
        },
        children: [{
          text: bind.to('href', href => {
            // If this is an existing document link, try to lookup its info
            if (href && isExistingDocumentLink(href)) {
              const linkInfo = this._findDocumentLink(href);

              if (linkInfo) {
                // Priority 1: Use title if available
                if (linkInfo.title) {
                  return linkInfo.title;
                }

                // Priority 2: Use documentDescription if available
                if (linkInfo.documentDescription) {
                  return linkInfo.documentDescription;
                }

                // Priority 3: Use serverFilePath if available
                if (linkInfo.serverFilePath) {
                  // Extract filename from path
                  const pathParts = linkInfo.serverFilePath.split('/');
                  const fileName = pathParts[pathParts.length - 1];
                  return fileName || linkInfo.serverFilePath;
                }
              }

              // If it's an existing document link but we couldn't find details,
              // use the extracted ID as a fallback
              const linkId = extractExternalDocumentLinkId(href);
              if (linkId) {
                // Extract filename from path if possible
                const pathParts = linkId.split('/');
                const fileName = pathParts[pathParts.length - 1];
                return fileName || linkId;
              }
            }

            // Final fallback: just use the href or a placeholder message
            return href || t('This link has no title');
          })
        }]
      }]
    });

    return customView;
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
