import * as utils from 'private-utils'
import { activityURL } from 'voyent'
import { getJSON} from 'public-utils'
import { updateLastActiveTimestamp } from 'auth-service'

/**
 *
 * Get the activity reports for a given realm.
 *
 * @memberOf voyent.activity
 * @alias getMetrics
 * @param {Object} params params
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.io.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 * @param {String} params.month Month to get the activity report for.
 * @param {String} params.year Year to get the activity report for.
 * @returns {Object} Activity report for month/year/realm.
 */

export function getMetrics(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            var account = utils.validateAndReturnRequiredAccount(params, reject);
            var realm = utils.validateAndReturnRequiredRealm(params, reject);
            var token = utils.validateAndReturnRequiredAccessToken(params, reject);

            var txParam = utils.getTransactionURLParam();
            var url = activityURL +
                    '/' + account + '/realms/' + realm + '/billingSummary?' +
                    (token ? 'access_token=' + token : '') +
                    (txParam ? '&' + txParam : '') + '&year=' + params.year + "&month=" + params.month;
            getJSON(url).then(function (data) {
                updateLastActiveTimestamp();
                resolve(data);
            })['catch'](function (error) {
                reject(error);
            });
        }
    );
}
