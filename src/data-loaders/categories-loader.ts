// src/data-loaders/categories-loader.ts
import AlightRequest from '../services/alight-request';
import { DocsService } from './../services/docs-service';

export default self.onmessage = async (event: MessageEvent<AlightRequest>) =>
  self.postMessage(await new DocsService(event.data).getCategories());

