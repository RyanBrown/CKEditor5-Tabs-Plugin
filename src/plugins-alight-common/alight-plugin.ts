import Plugin from "@ckeditor/ckeditor5-core/src/plugin";
import Editor from "../ckeditor";

export abstract class AlightPlugin extends Plugin {
  public override editor = this.editor as Editor;

  protected setOutput = (message: string, responseText?: string) => {
    this.editor.setData(responseText ?? message);
    console.log(message);
  }
}

