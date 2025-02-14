// src/plugins/alight-copy-plugin/tests/alight-copy-plugin-command.spec.ts
import ClassicEditor from '@ckeditor/ckeditor5-editor-classic/src/classiceditor';
import { Editor } from '@ckeditor/ckeditor5-core';
import { Link } from '@ckeditor/ckeditor5-link';
import Essentials from '@ckeditor/ckeditor5-essentials/src/essentials';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import { setData, getData } from '@ckeditor/ckeditor5-engine/src/dev-utils/model';
import AlightCopyPluginCommand from '../alight-copy-plugin-command';
import { LICENSE_KEY } from '../../../ckeditor';

describe('AlightCopyPluginCommand', () => {
  let editor: any;
  let element: HTMLElement;
  let command: AlightCopyPluginCommand;
  let originalClipboard: any;
  let originalExecCommand: any;
  let mockShowSuccess: jasmine.Spy;
  let mockShowWarning: jasmine.Spy;

  beforeEach(async () => {
    // Mock clipboard API
    originalClipboard = navigator.clipboard;
    originalExecCommand = document.execCommand;
    mockShowSuccess = jasmine.createSpy('showSuccess');
    mockShowWarning = jasmine.createSpy('showWarning');

    // Create test element
    element = document.createElement('div');
    document.body.appendChild(element);

    // Create editor instance
    editor = await ClassicEditor.create(element, {
      plugins: [Essentials, Paragraph, Link],
      licenseKey: LICENSE_KEY
    });

    // Setup command
    command = new AlightCopyPluginCommand(editor);
    editor.commands.add('alightCopyPlugin', command);

    // Mock notification plugin
    spyOn(editor.plugins, 'get').and.returnValue({
      showSuccess: mockShowSuccess,
      showWarning: mockShowWarning
    });
  });

  afterEach(async () => {
    // Cleanup
    await editor?.destroy();
    element?.remove();
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      configurable: true
    });
    document.execCommand = originalExecCommand;
  });

  it('should be disabled by default', () => {
    expect(command.isEnabled).toBeFalsy();
  });

  it('should be enabled when text is selected', () => {
    setData(editor.model, '<paragraph>foo[bar]baz</paragraph>');
    expect(command.isEnabled).toBeTruthy();
  });

  it('should remain disabled when selection is collapsed', () => {
    setData(editor.model, '<paragraph>foo[]bar</paragraph>');
    expect(command.isEnabled).toBeFalsy();
  });

  describe('execute()', () => {
    beforeEach(() => {
      // Set up test content
      setData(editor.model, '<paragraph>foo[bar]baz</paragraph>');
    });

    it('should copy selected content using Clipboard API', async () => {
      // Mock successful clipboard API
      const mockWrite = jasmine.createSpy('write').and.returnValue(Promise.resolve());
      spyOn(navigator.clipboard, 'write').and.callFake(mockWrite);

      await command.execute();

      expect(mockWrite).toHaveBeenCalled();
      expect(mockShowSuccess).toHaveBeenCalledWith(
        'Content copied with styles!',
        jasmine.any(Object)
      );
    });

    it('should fall back to execCommand when Clipboard API fails', async () => {
      // Mock failed clipboard API but successful execCommand
      const mockWrite = jasmine.createSpy('write').and.returnValue(Promise.reject(new Error()));
      spyOn(navigator.clipboard, 'write').and.callFake(mockWrite);
      spyOn(document, 'execCommand').and.returnValue(true);

      await command.execute();

      expect(document.execCommand).toHaveBeenCalledWith('copy');
      expect(mockShowSuccess).toHaveBeenCalledWith(
        'Content copied with styles!',
        jasmine.any(Object)
      );
    });

    it('should show error notification when all copy methods fail', async () => {
      // Mock all copy methods to fail
      const mockWrite = jasmine.createSpy('write').and.returnValue(Promise.reject(new Error()));
      spyOn(navigator.clipboard, 'write').and.callFake(mockWrite);
      spyOn(document, 'execCommand').and.returnValue(false);

      await command.execute();

      expect(mockShowWarning).toHaveBeenCalledWith(
        'Failed to copy content. Please try again.',
        jasmine.any(Object)
      );
    });

    it('should handle missing window.getSelection()', async () => {
      // Mock failed clipboard API and null selection
      const mockWrite = jasmine.createSpy('write').and.returnValue(Promise.reject(new Error()));
      spyOn(navigator.clipboard, 'write').and.callFake(mockWrite);
      const originalGetSelection = window.getSelection;
      spyOn(window, 'getSelection').and.returnValue(null);

      await command.execute();

      expect(mockShowWarning).toHaveBeenCalled();
      window.getSelection = originalGetSelection;
    });
  });
});