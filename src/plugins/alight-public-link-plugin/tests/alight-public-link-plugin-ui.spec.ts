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
    actionsView = balloon.visibleView as ActionsView;
  });

  afterEach(async () => {
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
      const linkData = {
        url: 'https://example.com',
        orgName: 'Example Org'
      };

      setData(
        editor.model,
        `<paragraph><$text alightPublicLinkPlugin='${JSON.stringify(linkData)}'>foo[]bar</$text></paragraph>`
      );

      expect(balloon.visibleView).toBeTruthy();
    });

    it('should hide balloon when selection moves outside link', () => {
      const linkData = {
        url: 'https://example.com',
        orgName: 'Example Org'
      };

      setData(
        editor.model,
        `<paragraph><$text alightPublicLinkPlugin='${JSON.stringify(linkData)}'>foo</$text>[]bar</paragraph>`
      );

      expect(balloon.visibleView).toBeNull();
    });

    it('should hide balloon when editor loses focus', () => {
      const linkData = {
        url: 'https://example.com',
        orgName: 'Example Org'
      };

      setData(
        editor.model,
        `<paragraph><$text alightPublicLinkPlugin='${JSON.stringify(linkData)}'>foo[]bar</$text></paragraph>`
      );

      editor.ui.focusTracker.isFocused = false;

      expect(balloon.visibleView).toBeNull();
    });
  });

  describe('ActionsView', () => {
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
  });

  describe('Modal behavior', () => {
    it('should show modal when toolbar button is clicked', () => {
      const button = editor.ui.componentFactory.create('alightPublicLinkPlugin');
      button.fire('execute');

      // Check if modal dialog exists in the DOM
      const modal = document.querySelector('.public-link-content');
      expect(modal).toBeTruthy();
    });

    it('should show modal with prefilled values when editing existing link', () => {
      const linkData = {
        url: 'https://example.com',
        orgName: 'Example Org'
      };

      setData(
        editor.model,
        `<paragraph><$text alightPublicLinkPlugin='${JSON.stringify(linkData)}'>foo[]bar</$text></paragraph>`
      );

      const balloon = editor.plugins.get('ContextualBalloon');
      const actionsView = balloon.visibleView;
      actionsView.editButtonView.fire('execute');

      const urlInput = document.querySelector('#link-url') as HTMLInputElement;
      const orgNameInput = document.querySelector('#org-name') as HTMLInputElement;

      expect(urlInput.value).toBe('https://example.com');
      expect(orgNameInput.value).toBe('Example Org');
    });

    it('should validate form before applying changes', () => {
      const button = editor.ui.componentFactory.create('alightPublicLinkPlugin');
      button.fire('execute');

      const continueButton = document.querySelector('.ck-button-action') as HTMLElement;
      continueButton.click();

      // Check if form validation error is shown
      const errorMessage = document.querySelector('.form-error');
      expect(errorMessage).toBeTruthy();
    });

    it('should close modal and update link when valid form is submitted', () => {
      const button = editor.ui.componentFactory.create('alightPublicLinkPlugin');
      button.fire('execute');

      const urlInput = document.querySelector('#link-url') as HTMLInputElement;
      const orgNameInput = document.querySelector('#org-name') as HTMLInputElement;

      urlInput.value = 'https://example.com';
      orgNameInput.value = 'Example Org';

      const continueButton = document.querySelector('.ck-button-action') as HTMLElement;
      continueButton.click();

      // Check if modal is closed
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