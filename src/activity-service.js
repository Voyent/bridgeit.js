function ActivityService(v,utils){
	
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
     * @param {String} params.date Day to get the activity report for, starts at 1.
     * @returns {Object} Activity report for month/year/realm.
     */

    return {
        getMetrics: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    var url = utils.getRealmResourceURL(v.eventURL, account, realm,
                        'events', token);

                    var txParam = utils.getTransactionURLParam();
                    var url;

                    if(params.date){
                        url = v.activityURL +
                            '/' + account + '/realms/' + realm + '/dailyBillingReport?' +
                            (token ? 'access_token=' + token : '') +
                            (txParam ? '&' + txParam : '') + '&year=' + params.year + "&month=" + params.month + "&date=" + params.date;
                    }
                    else{
                       url = v.activityURL +
                           '/' + account + '/realms/' + realm + '/billingSummary?' +
                           (token ? 'access_token=' + token : '') +
                           (txParam ? '&' + txParam : '') + '&year=' + params.year + "&month=" + params.month;
                    }
                    v.$.getJSON(url).then(function (data) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(data);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        }
    }
}