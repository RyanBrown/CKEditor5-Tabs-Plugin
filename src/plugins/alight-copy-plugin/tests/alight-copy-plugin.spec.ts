// src/plugins/alight-copy-plugin/tests/alight-copy-plugin.spec.ts
import ClassicEditor from '@ckeditor/ckeditor5-editor-classic/src/classiceditor';
import { Editor } from '@ckeditor/ckeditor5-core';
import { Link } from '@ckeditor/ckeditor5-link';
import Essentials from '@ckeditor/ckeditor5-essentials/src/essentials';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import AlightCopyPlugin from '../alight-copy-plugin';
import { LICENSE_KEY } from '../../../ckeditor';

describe('AlightCopyPlugin', () => {
  let editor: any;
  let element: HTMLElement;
  let plugin: AlightCopyPlugin;

  beforeEach(async () => {
    element = document.createElement('div');
    document.body.appendChild(element);

    editor = await ClassicEditor.create(element, {
      plugins: [Essentials, Paragraph, Link, AlightCopyPlugin],
      toolbar: ['alightCopyPlugin'],
      licenseKey: LICENSE_KEY
    });

    plugin = editor.plugins.get('AlightCopyPlugin');
  });

  afterEach(async () => {
    await editor?.destroy();
    element?.remove();
  });

  it('should be named correctly', () => {
    expect(AlightCopyPlugin.pluginName).toBe('AlightCopyPlugin');
  });

  it('should register the command', () => {
    const command = editor.commands.get('alightCopyPlugin');
    expect(command).toBeDefined();
  });

  describe('toolbar button', () => {
    let buttonView: any;

    beforeEach(() => {
      buttonView = editor.ui.componentFactory.create('alightCopyPlugin');
    });

    it('should be registered', () => {
      expect(buttonView).toBeDefined();
    });

    it('should have the correct label', () => {
      expect(buttonView.label).toBe('Copy with Styles');
    });

    it('should have tooltip enabled', () => {
      expect(buttonView.tooltip).toBeTruthy();
    });

    it('should be bound to command state', () => {
      const command = editor.commands.get('alightCopyPlugin');
      command.isEnabled = true;
      expect(buttonView.isEnabled).toBeTruthy();

      command.isEnabled = false;
      expect(buttonView.isEnabled).toBeFalsy();
    });

    it('should execute command on click', () => {
      const executeSpy = spyOn(editor, 'execute');
      buttonView.fire('execute');

      expect(executeSpy).toHaveBeenCalledWith('alightCopyPlugin');
    });
  });
});
