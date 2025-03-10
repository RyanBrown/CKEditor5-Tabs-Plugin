import Plugin from "@ckeditor/ckeditor5-core/src/plugin";
import AlightEditor from "../ckeditor";

export abstract class AlightPlugin extends Plugin {
  public override editor: AlightEditor = this.editor as AlightEditor;

  protected setOutput = (message: string, responseText?: string) => {
    this.editor.setData(responseText ?? message);
    console.log(message);
  }
}
