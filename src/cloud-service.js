import * as utils from './private-utils'
import { cloudURL, post } from './public-utils'
import { updateLastActiveTimestamp } from './auth-service'

/**
 * Push cloud notification to a given notify-back URI.
 *
 * @alias pushToNotifyBackURI
 * @param {String} notifyBackURI
 * @param {Object} params params
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name will be used.
 * @param {String} params.message The message is the cloud notification.
 *
 * @example
 * sendPushEvent({
 *      account: "<account>",
 *      realm: "<realm>",
 *      message: {
 *           "asynchronous": <boolean>,
 *           "global": {
 *              "detail": "<detail-string>",
 *               "expire_time": <long>,
 *               "icon": "<url-string>",
 *               "payload": {},
 *               "priority": "<string>",
 *               "subject": "<subject-string>",
 *               "url": "<url-string>"
 *           },
 *           "cloud": {
 *               "detail": "<detail-string>",
 *               "expire_time": <long>,
 *               "icon": "<url-string>",
 *               "payload": {},
 *               "priority": "<string>",
 *               "subject": "<subject-string>",
 *               "url": "<url-string>"
 *           }
 *           ....
 *       }
 * });
 */
export function pushToNotifyBackURI(notifyBackURI, params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);

            const url = utils.getRealmResourceURL(cloudURL, account, realm,
                'notify-back-uris/' + notifyBackURI, token);

            post(url, params.message).then(function (response) {
                updateLastActiveTimestamp();
                resolve(url);
            })['catch'](function (error) {
                reject(error);
            });

        }
    );
}

/**
 * Push cloud notification to a given list of notify-back URIs.
 *
 * @alias pushToNotifyBackURI
 * @param {Object} params params
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name will be used.
 * @param {String} params.message The message is the cloud notification.
 *
 * @example
 * sendPushEvent({
 *      account: "<account>",
 *      realm: "<realm>",
 *      message: {
 *           "asynchronous": <boolean>,
 *           "notify_back_uris": [
 *              "<notify-back-uri>",
 *              "<notify-back-uri>",
 *              ...
 *           ]
 *           "global": {
 *              "detail": "<detail-string>",
 *               "expire_time": <long>,
 *               "icon": "<url-string>",
 *               "payload": {},
 *               "priority": "<string>",
 *               "subject": "<subject-string>",
 *               "url": "<url-string>"
 *           },
 *           "cloud": {
 *               "detail": "<detail-string>",
 *               "expire_time": <long>,
 *               "icon": "<url-string>",
 *               "payload": {},
 *               "priority": "<string>",
 *               "subject": "<subject-string>",
 *               "url": "<url-string>"
 *           }
 *           ....
 *       }
 * });
 */
export function pushToNotifyBackURIs(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);

            const url = utils.getRealmResourceURL(cloudURL, account, realm,
                'notify-back-uris/', token);

            post(url, params.message).then(function (response) {
                updateLastActiveTimestamp();
                resolve(url);
            })['catch'](function (error) {
                reject(error);
            });
        }
    );
}