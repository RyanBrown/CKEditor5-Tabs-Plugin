export abstract class DataLoader {
  protected scriptUrl = async <T, F extends (...args: any[]) => T[] | Promise<T[]>>(dataFunction: F): Promise<string> =>
    URL.createObjectURL(new Blob([`self.onmessage = async (event) => self.postMessage(${JSON.stringify(await dataFunction())})`], { type: 'application/javascript' }));

  public run = async <T, F extends (...args: any[]) => T[] | Promise<T[]>>(dataFunction: F, callback?: (...args: any) => void): Promise<T[]> => {
    const loader = new Worker(await this.scriptUrl(dataFunction));
    loader.postMessage(0);
    return new Promise<T[]>((resolve, reject) => {
      loader.onmessage = (event: MessageEvent) => {
        callback && callback();
        resolve(event.data);
      };
      loader.onerror = (error) => reject(error);
    });
  }
}

export default class DataLoaderRunner extends DataLoader {
  public static run = <T, F extends (...args: any[]) => T[] | Promise<T[]>>(dataFunction: F, callback?: (...args: any) => void): Promise<T[]> => {
    return new DataLoaderRunner().run(dataFunction, callback);
  }
}
