// src/plugins/alight-public-link-plugin/tests/alight-public-link-plugin-ui.spec.ts
import ClassicEditor from '@ckeditor/ckeditor5-editor-classic/src/classiceditor';
import { Editor } from '@ckeditor/ckeditor5-core';
import { setData } from '@ckeditor/ckeditor5-engine/src/dev-utils/model';
import { ButtonView, View } from '@ckeditor/ckeditor5-ui';
import { ContextualBalloon } from '@ckeditor/ckeditor5-ui';
import Essentials from '@ckeditor/ckeditor5-essentials/src/essentials';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import Link from '@ckeditor/ckeditor5-link/src/link';
import AlightPublicLinkPlugin from '../alight-public-link-plugin';
import AlightPublicLinkPluginEditing from '../alight-public-link-plugin-editing';
import AlightPublicLinkPluginUI from '../alight-public-link-plugin-ui';
import { LICENSE_KEY } from '../../../ckeditor';

interface ActionsView extends View {
  editButtonView: ButtonView;
  unlinkButtonView: ButtonView;
  linkURLView: {
    element: HTMLElement;
  };
  updateLinkDisplay: (url: string) => void;
}

describe('AlightPublicLinkPluginUI', () => {
  let editor: any;
  let element: HTMLElement;
  let ui: AlightPublicLinkPluginUI;
  let balloon: ContextualBalloon;
  let actionsView: ActionsView;

  beforeEach(async () => {
    element = document.createElement('div');
    document.body.appendChild(element);

    editor = await ClassicEditor.create(element, {
      plugins: [Essentials, Paragraph, Link, AlightPublicLinkPlugin, ContextualBalloon],
      toolbar: ['alightPublicLinkPlugin'],
      licenseKey: LICENSE_KEY
    });

    // Don't call ui.init() or render() as they're already done by ClassicEditor.create()
    ui = editor.plugins.get('AlightPublicLinkPluginUI');
    balloon = editor.plugins.get('ContextualBalloon');

    // Add some content with a link to initialize the editor
    const linkData = {
      url: 'https://example.com',
      orgName: 'Example Org'
    };

    setData(
      editor.model,
      `<paragraph><$text alightPublicLinkPlugin='${JSON.stringify(linkData)}'>foo[]bar</$text></paragraph>`
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
      const button = editor.ui.componentFactory.create('alightPublicLinkPlugin');
      expect(button).toBeInstanceOf(ButtonView);
    });

    it('should bind button state to command state', () => {
      const button = editor.ui.componentFactory.create('alightPublicLinkPlugin');
      const command = editor.commands.get('alightPublicLinkPlugin');

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
        `<paragraph><$text alightPublicLinkPlugin='${JSON.stringify({
          url: 'https://example.com',
          orgName: 'Example Org'
        })}'>foo</$text>[]bar</paragraph>`
      );

      expect(balloon.visibleView).toBeNull();
    });

    it('should hide balloon when editor loses focus', async () => {
      expect(balloon.visibleView).toBeTruthy();

      // Move selection to end of paragraph
      editor.model.change((writer: any) => {
        const paragraph = editor.model.document.getRoot().getChild(0);
        const position = writer.createPositionAt(paragraph, 'end');
        writer.setSelection(position);
      });

      editor.ui.focusTracker.isFocused = false;

      // Wait for balloon updates
      await new Promise(resolve => setTimeout(resolve, 50));

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
        `<paragraph><$text alightPublicLinkPlugin='${JSON.stringify(linkData)}'>foo[]bar</$text></paragraph>`
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
      expect(spy).toHaveBeenCalledWith('alightPublicLinkPlugin');
    });
  });

  describe('Modal behavior', () => {
    beforeEach(() => {
      if ((ui as any)._modalDialog) {
        // Ensure any previous modal is cleaned up
        (ui as any)._modalDialog.destroy();
      }
    });

    it('should show modal when toolbar button is clicked', async () => {
      const button = editor.ui.componentFactory.create('alightPublicLinkPlugin');
      button.fire('execute');

      // Wait for modal to render
      await new Promise(resolve => setTimeout(resolve, 50));
      const modal = document.querySelector('.public-link-content');
      expect(modal).toBeTruthy();
    });

    it('should validate form before applying changes', async () => {
      const button = editor.ui.componentFactory.create('alightPublicLinkPlugin');
      button.fire('execute');

      // Wait for modal to render
      await new Promise(resolve => setTimeout(resolve, 50));

      // Simulate form submission with empty fields
      const form = document.querySelector('#public-link-form') as HTMLFormElement;
      if (form) {
        const event = new Event('submit');
        form.dispatchEvent(event);
      }

      await new Promise(resolve => setTimeout(resolve, 50));

      // After invalid submission, error message should be visible
      const errorMessage = document.querySelector('.form-error');
      expect(errorMessage).toBeTruthy();
    });

    it('should close modal and update link when valid form is submitted', async () => {
      const button = editor.ui.componentFactory.create('alightPublicLinkPlugin');
      button.fire('execute');

      // Wait for modal to render
      await new Promise(resolve => setTimeout(resolve, 50));

      // Fill in form fields
      const urlInput = document.querySelector('#link-url') as HTMLInputElement;
      const orgNameInput = document.querySelector('#org-name') as HTMLInputElement;

      if (urlInput && orgNameInput) {
        urlInput.value = 'https://example.com';
        orgNameInput.value = 'Example Org';

        // Submit the form
        const form = document.querySelector('#public-link-form') as HTMLFormElement;
        const event = new Event('submit', { cancelable: true });
        form.dispatchEvent(event);

        await new Promise(resolve => setTimeout(resolve, 50));

        const command = editor.commands.get('alightPublicLinkPlugin');
        expect(command.value).toEqual({
          url: 'https://example.com',
          orgName: 'Example Org'
        });

        // Wait for modal to close and check if it's gone
        await new Promise(resolve => setTimeout(resolve, 100));
        const modal = document.querySelector('.public-link-content');
        expect(modal).toBeNull();
      }
    });
  });
});