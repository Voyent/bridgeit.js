function DeviceService(v, utils) {
    return {
        /**
         * Start live reporting of a device
         *
         * @memberOf voyent.device
         * @alias startDevice
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.macAddress The address of the device to start.
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         */
        startDevice: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealm(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var url = utils.getRealmResourceURL(v.deviceURL, account, realm,
                    params.macAddress + '/start', token);

                v.$.put(url, {}).then(function () {
                    v.auth.updateLastActiveTimestamp();
                    resolve();
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },

        /**
         * Stop live reporting of a device
         *
         * @memberOf voyent.device
         * @alias stopDevice
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.macAddress The address of the device to stop.
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         */
        stopDevice: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealm(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var url = utils.getRealmResourceURL(v.deviceURL, account, realm,
                    params.macAddress + '/stop', token);

                v.$.put(url, {}).then(function () {
                    v.auth.updateLastActiveTimestamp();
                    resolve();
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },

        /**
         * Stop all device reporting
         *
         * @memberOf voyent.device
         * @alias stopDevices
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         */
        stopDevices: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealm(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                utils.validateRequiredId(params, reject);

                var url = utils.getRealmResourceURL(v.deviceURL, account, realm, '/stop', token);

                v.$.put(url, {}).then(function () {
                    v.auth.updateLastActiveTimestamp();
                    resolve();
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },

        /**
         * Get all devices reporting on realm/account
         *
         * @memberOf voyent.device
         * @alias getRunningDevices
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         */
        getRunningDevices: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealm(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var url = utils.getRealmResourceURL(v.deviceURL, account, realm, '/running', token);

                v.$.getJSON(url).then(function (devices) {
                    v.auth.updateLastActiveTimestamp();
                    resolve(devices);
                })['catch'](function (error) {
                    reject(error);
                });
            });
        }
    };
}