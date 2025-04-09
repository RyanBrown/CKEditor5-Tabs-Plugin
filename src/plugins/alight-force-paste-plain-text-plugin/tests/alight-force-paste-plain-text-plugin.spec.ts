// src/plugins/alight-force-paste-plain-text-plugin/tests/alight-force-paste-plain-text-plugin.spec.ts
import { ClassicEditor } from '@ckeditor/ckeditor5-editor-classic';
import { Paragraph } from '@ckeditor/ckeditor5-paragraph';
import { setData as setModelData } from '@ckeditor/ckeditor5-engine/src/dev-utils/model';
import { LICENSE_KEY } from '../../../ckeditor';
import AlightForcePastePlainText from '../alight-force-paste-plain-text-plugin';

describe('AlightForcePastePlainText', () => {
  let editor: ClassicEditor;
  let element: HTMLElement;

  beforeEach(async () => {
    element = document.createElement('div');
    document.body.appendChild(element);

    // Make sure we're explicitly including all required plugins
    editor = await ClassicEditor.create(element, {
      plugins: [Paragraph, AlightForcePastePlainText],
      licenseKey: LICENSE_KEY
    });
  });

  afterEach(() => {
    element.remove();
    return editor.destroy();
  });

  it('should be loaded', () => {
    // Use the static pluginName to get the plugin
    const plugin = editor.plugins.get('AlightForcePastePlainText');
    expect(plugin).toBeInstanceOf(AlightForcePastePlainText);
  });

  it('should convert pasted rich text to plain text', async () => {
    // Set initial editor content
    setModelData(editor.model, '<paragraph>[]</paragraph>');

    const dataTransfer = new DataTransfer();
    dataTransfer.setData('text/plain', 'Line 1\nLine 2');
    dataTransfer.setData('text/html', '<p><strong>Line 1</strong></p><p><em>Line 2</em></p>');

    // Fire the clipboard input event
    editor.editing.view.document.fire('clipboardInput', {
      dataTransfer,
      stop: () => { },
      preventDefault: () => { }
    });

    // Wait for any async operations to complete
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(editor.getData()).toBe('<p>Line 1</p><p>Line 2</p>');
  });
});