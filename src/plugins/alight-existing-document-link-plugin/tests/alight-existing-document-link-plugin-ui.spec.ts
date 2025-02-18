// src/plugins/alight-predefined-link-plugin/tests/alight-predefined-link-plugin-ui.spec.ts
import ClassicEditor from '@ckeditor/ckeditor5-editor-classic/src/classiceditor';
import { Editor } from '@ckeditor/ckeditor5-core';
import { setData } from '@ckeditor/ckeditor5-engine/src/dev-utils/model';
import { ButtonView, View } from '@ckeditor/ckeditor5-ui';
import { ContextualBalloon } from '@ckeditor/ckeditor5-ui';
import Essentials from '@ckeditor/ckeditor5-essentials/src/essentials';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import Link from '@ckeditor/ckeditor5-link/src/link';
import AlightExistingDocumentLinkPlugin from '../alight-existing-document-link-plugin';
import AlightExistingDocumentLinkPluginEditing from '../alight-existing-document-link-plugin-editing';
import AlightExistingDocumentLinkPluginUI from '../alight-existing-document-link-plugin-ui';
import { LICENSE_KEY } from '../../../ckeditor';

interface ActionsView extends View {
  editButtonView: ButtonView;
  unlinkButtonView: ButtonView;
  linkURLView: {
    element: HTMLElement;
  };
  updateLinkDisplay: (url: string) => void;
}

describe('AlightExistingDocumentLinkPluginUI', () => {
  let editor: any;
  let element: HTMLElement;
  let ui: AlightExistingDocumentLinkPluginUI;
  let balloon: ContextualBalloon;
  let actionsView: ActionsView;

  beforeEach(async () => {
    element = document.createElement('div');
    document.body.appendChild(element);

    editor = await ClassicEditor.create(element, {
      plugins: [Essentials, Paragraph, Link, AlightExistingDocumentLinkPlugin, ContextualBalloon],
      toolbar: ['alightExistingDocumentLinkPlugin'],
      licenseKey: LICENSE_KEY
    });

    // Don't call ui.init() or render() as they're already done by ClassicEditor.create()
    ui = editor.plugins.get('AlightExistingDocumentLinkPluginUI');
    balloon = editor.plugins.get('ContextualBalloon');

    // Add some content with a link to initialize the editor
    const linkData = {
      url: 'https://example.com',
      orgName: 'Example Org'
    };

    setData(
      editor.model,
      `<paragraph><$text alightExistingDocumentLinkPlugin='${JSON.stringify(linkData)}'>foo[]bar</$text></paragraph>`
    );

    (ui as any)._showBalloon();

    // Now we can safely get the actionsView
    actionsView = balloon.visibleView as ActionsView;
  });

  afterEach(async () => {
    if ((ui as any)._modalDialog) {
      // Ensure modal is destroyed between tests
      (ui as any)._modalDialog.destroy();
    }
    await editor?.destroy();
    element?.remove();
  });

  describe('init()', () => {
    it('should be loaded', () => {
      expect(ui).toBeTruthy();
    });

    it('should register toolbar component', () => {
      const button = editor.ui.componentFactory.create('alightExistingDocumentLinkPlugin');
      expect(button).toBeInstanceOf(ButtonView);
    });

    it('should bind button state to command state', () => {
      const button = editor.ui.componentFactory.create('alightExistingDocumentLinkPlugin');
      const command = editor.commands.get('alightExistingDocumentLinkPlugin');

      command.isEnabled = false;
      expect(button.isEnabled).toBe(false);

      command.isEnabled = true;
      expect(button.isEnabled).toBe(true);
    });
  });

  describe('balloon behavior', () => {
    it('should show balloon when link is selected', () => {
      expect(balloon.visibleView).toBeTruthy();
    });

    it('should hide balloon when selection moves outside link', () => {
      setData(
        editor.model,
        `<paragraph><$text alightExistingDocumentLinkPlugin='${JSON.stringify({
          url: 'https://example.com',
          orgName: 'Example Org'
        })}'>foo</$text>[]bar</paragraph>`
      );

      expect(balloon.visibleView).toBeNull();
    });

    it('should hide balloon when editor loses focus', async () => {
      // Set up link and show balloon
      const linkData = {
        url: 'https://example.com',
        orgName: 'Example Org'
      };

      setData(
        editor.model,
        `<paragraph><$text alightExistingDocumentLinkPlugin='${JSON.stringify(linkData)}'>foo[]bar</$text></paragraph>`
      );

      // Wait for balloon to show
      await new Promise(resolve => setTimeout(resolve, 50));

      // Simulate focus loss
      editor.ui.focusTracker.isFocused = false;

      // Wait for balloon to hide
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(balloon.visibleView).toBeNull();
    });
  });

  describe('ActionsView', () => {
    beforeEach(() => {
      // Ensure we have a visible ActionsView before each test
      const linkData = {
        url: 'https://example.com',
        orgName: 'Example Org'
      };

      setData(
        editor.model,
        `<paragraph><$text alightExistingDocumentLinkPlugin='${JSON.stringify(linkData)}'>foo[]bar</$text></paragraph>`
      );

      (ui as any)._showBalloon();
      actionsView = balloon.visibleView as ActionsView;
    });

    it('should render edit button', () => {
      expect(actionsView.editButtonView).toBeTruthy();
      expect(actionsView.editButtonView).toBeInstanceOf(ButtonView);
    });

    it('should render unlink button', () => {
      expect(actionsView.unlinkButtonView).toBeTruthy();
      expect(actionsView.unlinkButtonView).toBeInstanceOf(ButtonView);
    });

    it('should display current URL', () => {
      expect(actionsView.linkURLView.element.textContent).toContain('https://example.com');
    });

    it('should update URL display when link changes', async () => {
      const newUrl = 'https://new-example.com';

      // Remove current view from balloon
      balloon.remove(actionsView);

      // Create new actionsView with updated URL
      actionsView = (ui as any)._createActionsView();
      actionsView.updateLinkDisplay(newUrl);

      // Add new view to balloon
      balloon.add({
        view: actionsView,
        position: {
          target: editor.editing.view.getDomRoot()
        }
      });

      expect(actionsView.linkURLView.element.textContent?.trim()).toBe(newUrl);
    });

    it('should execute unlink command when unlink button is clicked', () => {
      const spy = jasmine.createSpy('execute');
      editor.execute = spy;
      actionsView.unlinkButtonView.fire('execute');
      expect(spy).toHaveBeenCalledWith('alightExistingDocumentLinkPlugin');
    });
  });

  // describe('Modal behavior', () => {
  //   it('should validate form before applying changes', async () => {
  //     const button = editor.ui.componentFactory.create('alightExistingDocumentLinkPlugin');
  //     button.fire('execute');

  //     // Wait for modal to render
  //     await new Promise(resolve => setTimeout(resolve, 100));

  //     const form = document.querySelector('#predefined-link-form');
  //     expect(form).toBeTruthy();

  //     // Try to submit empty form
  //     if (form) {
  //       const event = new Event('submit');
  //       form.dispatchEvent(event);
  //     }

  //     // Wait for validation
  //     await new Promise(resolve => setTimeout(resolve, 50));

  //     const urlInput = document.querySelector('#link-url') as HTMLInputElement;
  //     expect(urlInput?.validity.valid).toBe(false);
  //   });
  // });
});