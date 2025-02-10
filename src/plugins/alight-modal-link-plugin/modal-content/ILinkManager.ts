// src/plugins/alight-link-plugin/modal-content/ILinkManager.ts

/**
 * Minimal interface that both managers implement.
 * This allows the command to work with any manager interchangeably.
 */

import { Plugin } from '@ckeditor/ckeditor5-core';
import { View, ButtonView, ContextualBalloon } from '@ckeditor/ckeditor5-ui';
import type { Editor } from '@ckeditor/ckeditor5-core';
import { ExistingDocumentLinkManager } from './existing-document-link';
import editIcon from './../assets/icon-pencil.svg';
import unlinkIcon from './../assets/icon-unlink.svg';

export interface BalloonAction {
  label: string;
  icon: string;
  execute: () => void;
}

export interface ILinkManager {
  // Returns the raw HTML string for a given page of data.
  getLinkContent(page: number): string;

  // Renders the current UI (including attaching events) into the container.
  renderContent(container: HTMLElement): void;

  // Resets internal filters, pagination, etc. (if needed).
  resetSearch?(): void;

  // Returns the selected link.
  getSelectedLink(): { destination: string; title: string } | null;

  showBalloon?(selection: any): void;
  hideBalloon?(): void;
  getEditActions(): BalloonAction[]; // Made public
}

export abstract class BalloonLinkManager implements ILinkManager {
  protected editor: Editor;
  protected balloon: ContextualBalloon;
  protected formView: View;

  constructor(editor: Editor) {
    this.editor = editor;
    this.balloon = editor.plugins.get('ContextualBalloon');
    this.formView = this.createBalloonView(this.getEditActions());
  }

  showBalloon(selection: any): void {
    const modelRange = selection.getFirstRange();
    if (!modelRange || modelRange.isCollapsed) {
      this.hideBalloon();
      return;
    }

    const viewRange = this.editor.editing.mapper.toViewRange(modelRange);
    const domRange = this.editor.editing.view.domConverter.viewRangeToDom(viewRange);

    if (domRange) {
      this.balloon.add({
        view: this.formView,
        position: { target: domRange }
      });
    }
  }

  hideBalloon(): void {
    if (this.balloon.hasView(this.formView)) {
      this.balloon.remove(this.formView);
    }
  }

  abstract getLinkContent(page: number): string;
  abstract renderContent(container: HTMLElement): void;
  abstract getSelectedLink(): { destination: string; title: string } | null;
  abstract resetSearch?(): void;
  abstract getEditActions(): BalloonAction[]; // Made public

  private createBalloonView(actions: BalloonAction[]): View {
    const formView = new View(this.editor.locale);

    const actionButtons = actions.map(action => {
      const button = new ButtonView(this.editor.locale);
      button.set({
        label: action.label,
        icon: action.icon,
        tooltip: true,
        withText: false
      });
      button.on('execute', action.execute);
      return button;
    });

    formView.setTemplate({
      tag: 'div',
      attributes: {
        class: ['ck', 'ck-link-actions', 'ck-responsive-form'],
        tabindex: '-1'
      },
      children: [
        {
          tag: 'div',
          attributes: {
            class: ['ck', 'ck-link-actions__buttons']
          },
          children: actionButtons
        }
      ]
    });

    return formView;
  }
}

export class PredefinedLinkManager extends BalloonLinkManager {
  override getEditActions(): BalloonAction[] {
    return [
      {
        label: 'Edit Predefined Link',
        icon: editIcon,
        execute: () => {
          const link = this.getSelectedLink();
          if (link) {
            this.editor.execute('linkOption1');
          }
          this.hideBalloon();
        }
      },
      {
        label: 'Remove Link',
        icon: unlinkIcon,
        execute: () => {
          this.editor.execute('unlink');
          this.hideBalloon();
        }
      }
    ];
  }

  getLinkContent(page: number): string {
    // Implementation
    return '';
  }

  renderContent(container: HTMLElement): void {
    // Implementation
  }

  getSelectedLink(): { destination: string; title: string } | null {
    // Implementation
    return null;
  }

  resetSearch(): void {
    // Implementation
  }
}

export class AlightModalLinkPluginEditing extends Plugin {
  public predefinedLinkManager!: PredefinedLinkManager;
  public existingDocumentLinkManager!: ExistingDocumentLinkManager;

  init(): void {
    this.predefinedLinkManager = new PredefinedLinkManager(this.editor);
    this.existingDocumentLinkManager = new ExistingDocumentLinkManager(this.editor);

    this.editor.model.document.selection.on('change:range', () => {
      const selection = this.editor.model.document.selection;
      if (selection.hasAttribute('linkHref')) {
        const linkType = selection.getAttribute('linkType');
        switch (linkType) {
          case 'predefined':
            this.predefinedLinkManager.showBalloon(selection);
            break;
          case 'existing-document':
            this.existingDocumentLinkManager.showBalloon(selection);
            break;
        }
      }
    });
  }
}