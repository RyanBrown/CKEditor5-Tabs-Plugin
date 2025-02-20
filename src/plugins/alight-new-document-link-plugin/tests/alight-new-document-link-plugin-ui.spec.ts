// src/plugins/alight-new-document-link-plugin/tests/alight-new-document-link-plugin-ui.spec.ts

import AlightNewDocumentLinkPluginUI from '../alight-new-document-link-plugin-ui';
import { ContentManager } from '../modal-content/alight-new-document-link-plugin-modal-ContentManager';
import { CkAlightModalDialog } from '../../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import { Notification } from '@ckeditor/ckeditor5-ui';
import { LICENSE_KEY } from '../../../ckeditor';

describe('AlightNewDocumentLinkPluginUI', () => {
  let plugin: AlightNewDocumentLinkPluginUI;
  let editor: any;
  let buttonView: ButtonView;
  let mockContentManager: jasmine.SpyObj<ContentManager>;
  let mockModalDialog: jasmine.SpyObj<CkAlightModalDialog>;
  let mockNotification: jasmine.SpyObj<Notification>;

  beforeEach(() => {
    // Create mock editor
    editor = {
      t: (text: string) => text,
      ui: {
        componentFactory: {
          add: jasmine.createSpy('add')
        }
      },
      plugins: {
        get: jasmine.createSpy('get')
      },
      config: {
        get: () => LICENSE_KEY
      }
    };

    // Create mock ButtonView
    buttonView = {
      set: jasmine.createSpy('set'),
      on: jasmine.createSpy('on'),
      isEnabled: true
    } as unknown as ButtonView;

    // Create mock ContentManager
    mockContentManager = jasmine.createSpyObj('ContentManager', [
      'renderContent',
      'setModalDialog',
      'validateForm',
      'submitForm',
      'resetForm',
      'getFormData',
      'destroy'
    ]);

    // Create mock ModalDialog
    mockModalDialog = jasmine.createSpyObj('CkAlightModalDialog', [
      'on',
      'setContent',
      'show',
      'hide',
      'destroy'
    ]);
    // Create mock element since we can't assign directly
    const element = document.createElement('div');
    Object.defineProperty(mockModalDialog, 'element', {
      get: () => element
    });

    // Create mock Notification
    mockNotification = jasmine.createSpyObj('Notification', ['showSuccess', 'showWarning']);

    // Set up spies
    spyOn(window, 'setTimeout');

    // Initialize plugin
    plugin = new AlightNewDocumentLinkPluginUI(editor);
    (plugin as any)._formManager = mockContentManager;
    (plugin as any)._modalDialog = mockModalDialog;
  });

  describe('initialization', () => {
    it('should register plugin name correctly', () => {
      expect(AlightNewDocumentLinkPluginUI.pluginName).toBe('AlightNewDocumentLinkPluginUI');
    });

    it('should require Notification plugin', () => {
      expect(AlightNewDocumentLinkPluginUI.requires).toContain(Notification);
    });

    it('should initialize toolbar button and form manager', () => {
      spyOn(plugin as any, '_setupToolbarButton');
      spyOn(plugin as any, '_initializeFormManager');

      plugin.init();

      expect(plugin['_setupToolbarButton']).toHaveBeenCalled();
      expect(plugin['_initializeFormManager']).toHaveBeenCalled();
    });
  });

  describe('toolbar button setup', () => {
    it('should add button to component factory', () => {
      plugin['_setupToolbarButton']();

      expect(editor.ui.componentFactory.add).toHaveBeenCalledWith(
        'alightNewDocumentLinkPlugin',
        jasmine.any(Function)
      );
    });

    it('should configure button correctly', () => {
      const locale = {};
      editor.ui.componentFactory.add.and.callFake((name: any, callback: (arg0: {}) => ButtonView) => {
        buttonView = callback(locale);
        return buttonView;
      });

      plugin['_setupToolbarButton']();

      expect(buttonView.set).toHaveBeenCalledWith({
        label: 'New Document',
        icon: jasmine.any(String),
        tooltip: true,
        withText: true
      });
    });

    it('should show modal when button is executed', () => {
      spyOn(plugin as any, '_showModal');
      editor.ui.componentFactory.add.and.callFake((name: any, callback: (arg0: {}) => ButtonView) => {
        buttonView = callback({});
        return buttonView;
      });
      plugin['_setupToolbarButton']();
      // Get the execute handler by calling the spy's first call arguments
      const executeHandler = (buttonView.on as jasmine.Spy).calls.argsFor(0)[1];
      executeHandler();

      expect(plugin['_showModal']).toHaveBeenCalled();
    });
  });

  describe('modal dialog', () => {
    it('should create modal with correct configuration', () => {
      spyOn(Object.getPrototypeOf(window), 'CkAlightModalDialog').and.returnValue(mockModalDialog);

      plugin['_showModal']();

      expect(mockModalDialog.on).toHaveBeenCalledWith('buttonClick', jasmine.any(Function));
      expect(mockContentManager.setModalDialog).toHaveBeenCalledWith(mockModalDialog);
    });

    it('should handle Clear button click', async () => {
      const buttonClickHandler = mockModalDialog.on.calls.argsFor(0)[1];
      await buttonClickHandler('Clear');

      expect(mockContentManager.resetForm).toHaveBeenCalled();
    });

    it('should handle Submit button click with valid form', async () => {
      mockContentManager.validateForm.and.returnValue({ isValid: true });
      mockContentManager.submitForm.and.returnValue(Promise.resolve({ success: true }));
      editor.plugins.get.and.returnValue(mockNotification);

      const buttonClickHandler = mockModalDialog.on.calls.argsFor(0)[1];
      await buttonClickHandler('Submit');

      expect(mockContentManager.submitForm).toHaveBeenCalled();
      expect(mockNotification.showSuccess).toHaveBeenCalledWith('Document uploaded successfully');
      expect(mockContentManager.resetForm).toHaveBeenCalled();
      expect(setTimeout).toHaveBeenCalledWith(jasmine.any(Function), 100);
    });

    it('should handle Submit button click with invalid form', async () => {
      mockContentManager.validateForm.and.returnValue({
        isValid: false,
        errors: { title: 'Required field' }
      });

      const buttonClickHandler = mockModalDialog.on.calls.argsFor(0)[1];
      await buttonClickHandler('Submit');

      expect(mockContentManager.submitForm).not.toHaveBeenCalled();
    });

    it('should handle submission errors', async () => {
      mockContentManager.validateForm.and.returnValue({ isValid: true });
      mockContentManager.submitForm.and.throwError('Network error');
      editor.plugins.get.and.returnValue(mockNotification);

      const buttonClickHandler = mockModalDialog.on.calls.argsFor(0)[1];
      await buttonClickHandler('Submit');

      expect(mockNotification.showWarning).toHaveBeenCalledWith('Network error');
    });
  });

  describe('form submission handling', () => {
    let submitButton: HTMLButtonElement;
    let clearButton: HTMLButtonElement;

    beforeEach(() => {
      submitButton = document.createElement('button');
      clearButton = document.createElement('button');
      submitButton.classList.add('cka-button-primary');
      clearButton.classList.add('cka-button-outlined');
      mockModalDialog.element?.appendChild(submitButton);
      mockModalDialog.element?.appendChild(clearButton);
    });

    it('should disable buttons during submission', async () => {
      mockContentManager.validateForm.and.returnValue({ isValid: true });
      mockContentManager.submitForm.and.returnValue(Promise.resolve({ success: true }));
      editor.plugins.get.and.returnValue(mockNotification);

      await plugin['_handleFormSubmission']();

      expect(submitButton.disabled).toBeFalse();
      expect(clearButton.disabled).toBeFalse();
      expect(submitButton.classList.contains('loading')).toBeFalse();
    });

    it('should re-enable buttons after submission', async () => {
      mockContentManager.validateForm.and.returnValue({ isValid: true });
      mockContentManager.submitForm.and.returnValue(Promise.resolve({ success: true }));
      editor.plugins.get.and.returnValue(mockNotification);

      await plugin['_handleFormSubmission']();

      expect(submitButton.disabled).toBeFalse();
      expect(clearButton.disabled).toBeFalse();
      expect(submitButton.classList.contains('loading')).toBeFalse();
    });
  });

  describe('destruction', () => {
    it('should clean up resources', () => {
      plugin.destroy();

      expect(mockModalDialog.destroy).toHaveBeenCalled();
      expect(mockContentManager.destroy).toHaveBeenCalled();
    });
  });
});