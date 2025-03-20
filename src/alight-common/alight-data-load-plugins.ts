// src/alight-common/alight-data-load-plugins.ts
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import { AlightPlugin } from './alight-plugin';
import SessionService from '../services/session-service';

export abstract class AlightDataloadPlugin extends AlightPlugin {

  public static override get pluginName(): string { return 'AlightDataloadPlugin' as const; }

  private _isReady: boolean = false;
  private get isReady(): boolean { return this._isReady; }
  private set isReady(value: boolean) { this._isReady = value; }

  protected buttonView: InstanceType<typeof ButtonView>;
  protected loadData = async (loader: Worker, callback?: () => void): Promise<any[] | Map<string, any>> => {
    return new Promise<any[] | Map<string, any>>((resolve, reject) => {
      loader.onmessage = (event: MessageEvent<any[] | Map<string, any>>) => {
        callback?.()
        resolve(event.data);
      }
      loader.onerror = (error: ErrorEvent) => {
        console.error(`Error occurred loading ${this.pluginName}: ${error ?? ""}`, error);
        reject(error);
      }
      loader.postMessage(SessionService.getInstance().alightRequest);
    });
  }

  protected _enablePluginButton = () => {
    if (this.buttonView)
      this.buttonView.isEnabled = this._isReady;
  }

  protected abstract _populationRequisiteData(): void;
}