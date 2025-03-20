// src/data-loaders/predefined-links-loader.ts
// src/data-loaders/categories-loader.ts
import AlightRequest from '../services/alight-request';
import { LinksService } from './../services/links-service';

export default self.onmessage = async (event: MessageEvent<AlightRequest>) =>
  self.postMessage(await new LinksService(event.data).getPredefinedLinks());

