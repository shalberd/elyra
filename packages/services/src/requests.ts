/*
 * Copyright 2018-2025 Elyra Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Dialog } from '@jupyterlab/apputils';
import { URLExt } from '@jupyterlab/coreutils';
import { ServerConnection } from '@jupyterlab/services';

import { IElyraResource } from './types';

/**
 * A service class for making requests to the jupyter lab server.
 */
export class RequestHandler {
  /**
   * Make a GET request to the jupyter lab server.
   *
   * All errors returned by the server are handled by displaying a relevant
   * error dialog. If provided a `longRequestDialog` then the dialog is displayed
   * to users while waiting for the server response. On success a promise that
   * resolves to the server response is returned.
   *
   * @param requestPath - The url path for the request.
   * This path is appended to the base path of the server for the request.
   *
   * @param longRequestDialog - A optional Dialog param.
   * A warning Dialog to display while waiting for the request to return.
   *
   * @returns a promise that resolves with the server response on success or
   * an error dialog result in cases of failure.
   */
  static async makeGetRequest<T = IElyraResource>(
    requestPath: string,
    longRequestDialog?: Dialog<void>
  ): Promise<T | undefined> {
    return this.makeServerRequest(
      requestPath,
      { method: 'GET' },
      longRequestDialog
    );
  }

  /**
   * Make a POST request to the jupyter lab server.
   *
   * All errors returned by the server are handled by displaying a relevant
   * error dialog. If provided a `longRequestDialog` then the dialog is displayed
   * to users while waiting for the server response. On success a promise that
   * resolves to the server response is returned.
   *
   * @param requestPath - The url path for the request.
   * This path is appended to the base path of the server for the request.
   *
   * @param requestBody - The body of the request.
   * Will be included in the RequestInit object passed to `makeServerRequest`
   *
   * @param longRequestDialog - A optional Dialog param.
   * A warning Dialog to display while waiting for the request to return.
   *
   * @returns a promise that resolves with the server response on success or
   * an error dialog result in cases of failure.
   */
  static async makePostRequest<T = IElyraResource>(
    requestPath: string,
    requestBody: RequestInit['body'],
    longRequestDialog?: Dialog<void>
  ): Promise<T | undefined> {
    return this.makeServerRequest(
      requestPath,
      { method: 'POST', body: requestBody },
      longRequestDialog
    );
  }

  /**
   * Make a PUT request to the jupyter lab server.
   *
   * All errors returned by the server are handled by displaying a relevant
   * error dialog. If provided a `longRequestDialog` then the dialog is displayed
   * to users while waiting for the server response. On success a promise that
   * resolves to the server response is returned.
   *
   * @param requestPath - The url path for the request.
   * This path is appended to the base path of the server for the request.
   *
   * @param requestBody - The body of the request.
   * Will be included in the RequestInit object passed to `makeServerRequest`
   *
   * @param longRequestDialog - A optional Dialog param.
   * A warning Dialog to display while waiting for the request to return.
   *
   * @returns a promise that resolves with the server response on success or
   * an error dialog result in cases of failure.
   */
  static async makePutRequest<T = IElyraResource>(
    requestPath: string,
    requestBody: RequestInit['body'],
    longRequestDialog?: Dialog<void>
  ): Promise<T | undefined> {
    return this.makeServerRequest(
      requestPath,
      { method: 'PUT', body: requestBody },
      longRequestDialog
    );
  }

  /**
   * Make a DELETE request to the jupyter lab server.
   *
   * All errors returned by the server are handled by displaying a relevant
   * error dialog. If provided a `longRequestDialog` then the dialog is displayed
   * to users while waiting for the server response. On success a promise that
   * resolves to the server response is returned.
   *
   * @param requestPath - The url path for the request.
   * This path is appended to the base path of the server for the request.
   *
   * @param longRequestDialog - A optional Dialog param.
   * A warning Dialog to display while waiting for the request to return.
   *
   * @returns a promise that resolves with the server response on success or
   * an error dialog result in cases of failure.
   */
  static async makeDeleteRequest<T = IElyraResource>(
    requestPath: string,
    longRequestDialog?: Dialog<void>
  ): Promise<T | undefined> {
    return this.makeServerRequest(
      requestPath,
      { method: 'DELETE' },
      longRequestDialog
    );
  }

  /**
   * Make a request to the jupyter lab server.
   *
   * The method of request is set in the `method` value in `requestInit`.
   * All errors returned by the server are handled by displaying a relevant
   * error dialog. If provided a `longRequestDialog` then the dialog is displayed
   * to users while waiting for the server response. On success a promise that
   * resolves to the server response is returned.
   *
   * @param requestPath - The url path for the request.
   * This path is appended to the base path of the server for the request.
   *
   * @param requestInit - The initialization options for the request.
   * A RequestInit object to be passed directly to `ServerConnection.makeRequest`
   * that must include a value for `method`.
   * This is based on "@typescript/lib/lib.dom.d/RequestInit"
   * @see {@link https://github.com/Microsoft/TypeScript/blob/master/lib/lib.dom.d.ts#L1558}
   * and {@link https://fetch.spec.whatwg.org/#requestinit}
   *
   * @param longRequestDialog - A optional Dialog param.
   * A warning Dialog to display while waiting for the request to return.
   *
   * @returns a promise that resolves with the server response on success or
   * an error dialog result in cases of failure.
   */
  static async makeServerRequest<T = IElyraResource>(
    requestPath: string,
    options: RequestInit & { type?: 'blob' | 'json' | 'text' },
    longRequestDialog?: Dialog<void>
  ): Promise<T | undefined> {
    // use ServerConnection utility to make calls to Jupyter Based services
    // which in this case are in the extension installed by this package
    const settings = ServerConnection.makeSettings();
    const requestUrl = URLExt.join(settings.baseUrl, requestPath);

    const { type = 'json', ...requestInit } = options;

    console.log(`Sending a ${requestInit.method} request to ${requestUrl}`);

    if (longRequestDialog) {
      longRequestDialog.launch();
    }

    const getServerResponse = new Promise<T | undefined>((resolve, reject) => {
      ServerConnection.makeRequest(requestUrl, requestInit, settings).then(
        (response: Response) => {
          if (longRequestDialog) {
            longRequestDialog.resolve();
          }

          response[type]().then(
            // handle cases where the server returns a valid response
            (result) => {
              if (response.status === 405) {
                resolve(undefined);
              }
              if (response.status < 200 || response.status >= 300) {
                return reject(result);
              }

              resolve(result);
            },
            // handle 404 if the server is not found
            (reason) => {
              if (response.status === 404 || response.status === 409) {
                return reject({ ...response, requestPath: requestPath });
              } else if (response.status === 204) {
                resolve(undefined);
              } else {
                return reject(reason);
              }
            }
          );
        },
        // something unexpected went wrong with the request
        (reason) => {
          console.error(reason);
          return reject(reason);
        }
      );
    });

    const serverResponse = await getServerResponse;
    return serverResponse;
  }
}
