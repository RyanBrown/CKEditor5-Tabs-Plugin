// src/plugins-alight-common/alight-plugin.ts
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import AlightEditor from '../ckeditor';
export abstract class AlightPlugin extends Plugin {
  public override editor: AlightEditor = this.editor as AlightEditor;

  protected setOutput = (uiMessage: string, consoleMessage?: string) => {
    this.editor.setData(uiMessage);
    console.log(consoleMessage ?? uiMessage);
  }

  protected validateResponse = (responseString: string, errorMessage: string) => {
    if (responseString == null) { throw new Error(errorMessage); }
  }
}