// src/alight-common/alight-data-load-plugins.ts
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import { AlightPlugin } from './alight-plugin';

export default class AlightDataLoadPlugin extends AlightPlugin {

  public static override get pluginName(): string { return 'AlightDataLoadPlugin' as const; }

  protected get verboseMode(): boolean { return true; }

  private _isReady: boolean = false;
  protected get _isReady(): boolean { return this._isReady; }
  protected set _isReady(value: boolean) { this._isReady = value; }

  protected buttonView: InstanceType<typeof ButtonView>;

  protected _enablePluginButton = () => {
    if (this.buttonView)
      this.buttonView.isEnabled = this._isReady;
  }

  protected abstract setModalContents(): void;
}
