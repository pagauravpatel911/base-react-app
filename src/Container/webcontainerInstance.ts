// src/webcontainerInstance.ts
import { WebContainer } from '@webcontainer/api';

let instance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

export async function getWebContainerInstance(): Promise<WebContainer> {
    if (instance) {
        return instance;
    }

    if (!bootPromise) {
        bootPromise = WebContainer.boot()
            .then((wc) => {
                instance = wc;
                return wc;
            })
            .catch((err) => {
                bootPromise = null; // Reset on error for retry
                throw err;
            });
    }

    return bootPromise;
}