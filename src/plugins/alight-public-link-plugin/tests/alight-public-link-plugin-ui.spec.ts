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

    // Force the balloon to show
    (ui as any)._showBalloon();

    // Now we can safely get the actionsView
    actionsView = balloon.visibleView as ActionsView;
  });

  afterEach(async () => {
    // Ensure modal is destroyed between tests
    (ui as any)._modalDialog?.destroy();
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
      // First ensure balloon is visible
      expect(balloon.visibleView).toBeTruthy();
      // Trigger focus loss
      editor.ui.focusTracker.isFocused = false;
      // Wait for next tick to allow balloon to update
      await new Promise(resolve => setTimeout(resolve, 0));
      // Now check if balloon is hidden
      expect(balloon.hasView(actionsView)).toBe(false);
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

    it('should update URL display when link changes', () => {
      actionsView.updateLinkDisplay('https://new-example.com');
      expect(actionsView.linkURLView.element.textContent).toContain('https://new-example.com');
    });

    it('should execute unlink command when unlink button is clicked', () => {
      const spy = jasmine.createSpy('execute');
      editor.execute = spy;
      actionsView.unlinkButtonView.fire('execute');
      expect(spy).toHaveBeenCalledWith('alightPublicLinkPlugin');
    });

    it('should update URL display when link changes', async () => {
      const newUrl = 'https://new-example.com';
      // Force a re-render of the view
      actionsView.updateLinkDisplay(newUrl);
      actionsView.render();
      // Wait for DOM update
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(actionsView.linkURLView.element.textContent?.trim()).toBe(newUrl);
    });
  });

  describe('Modal behavior', () => {
    beforeEach(() => {
      // Ensure any previous modal is cleaned up
      (ui as any)._modalDialog?.destroy();
    });

    it('should show modal when toolbar button is clicked', async () => {
      const button = editor.ui.componentFactory.create('alightPublicLinkPlugin');
      button.fire('execute');

      // Wait for modal to render
      await new Promise(resolve => setTimeout(resolve, 0));
      const modal = document.querySelector('.public-link-content');
      expect(modal).toBeTruthy();
    });

    it('should validate form before applying changes', async () => {
      const button = editor.ui.componentFactory.create('alightPublicLinkPlugin');
      button.fire('execute');

      // Wait for modal to render
      await new Promise(resolve => setTimeout(resolve, 0));

      // Trigger button click through modal's event system
      (ui as any)._modalDialog.fire('buttonClick', 'Continue');

      const errorMessage = document.querySelector('.form-error');
      expect(errorMessage).toBeTruthy();
    });

    it('should close modal and update link when valid form is submitted', async () => {
      const button = editor.ui.componentFactory.create('alightPublicLinkPlugin');
      button.fire('execute');

      // Wait for modal to render
      await new Promise(resolve => setTimeout(resolve, 0));

      // Set form values
      const urlInput = document.querySelector('#link-url') as HTMLInputElement;
      const orgNameInput = document.querySelector('#org-name') as HTMLInputElement;

      urlInput.value = 'https://example.com';
      orgNameInput.value = 'Example Org';

      // Trigger form submission through modal's event system
      (ui as any)._modalDialog.fire('buttonClick', 'Continue');

      // Wait for modal to close
      await new Promise(resolve => setTimeout(resolve, 0));

      const modal = document.querySelector('.public-link-content');
      expect(modal).toBeNull();

      // Check if link was updated
      const command = editor.commands.get('alightPublicLinkPlugin');
      expect(command.value).toEqual({
        url: 'https://example.com',
        orgName: 'Example Org'
      });
    });
  });
});