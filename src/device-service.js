function DeviceService(v, utils) {
    return {
        /**
         * Start live reporting of a device
         *
         * @alias startDevice
         * @param {Object} params params
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.macAddress The address of the device to start.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         */
        startDevice: function(params){
            return new Promise(function(resolve, reject) {
                params = params ? params : {};
                v.checkHost(params);

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealm(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                utils.validateRequiredId(params, reject);

                var url = utils.getRealmResourceURL(v.deviceURL, account, realm,
                    params.macAddress+'/start', token, params.ssl);

                v.$.put(url, {}).then(function(){
                    v.auth.updateLastActiveTimestamp();
                    resolve();
                })['catch'](function(error){
                    reject(error);
                });
            });
        },

        /**
         * Stop live reporting of a device
         *
         * @alias stopDevice
         * @param {Object} params params
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.macAddress The address of the device to stop.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         */
        stopDevice: function(params){
            return new Promise(function(resolve, reject) {
                params = params ? params : {};
                v.checkHost(params);

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealm(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                utils.validateRequiredId(params, reject);

                var url = utils.getRealmResourceURL(v.deviceURL, account, realm,
                    params.macAddress+'/stop', token, params.ssl);

                v.$.put(url, {}).then(function(){
                    v.auth.updateLastActiveTimestamp();
                    resolve();
                })['catch'](function(error){
                    reject(error);
                });
            });
        },

        /**
         * Stop all device reporting
         *
         * @alias stopDevices
         * @param {Object} params params
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         */
        stopDevices: function(params){
            return new Promise(function(resolve, reject) {
                params = params ? params : {};
                v.checkHost(params);

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealm(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                utils.validateRequiredId(params, reject);

                var url = utils.getRealmResourceURL(v.deviceURL, account, realm,'/stop', token, params.ssl);

                v.$.put(url, {}).then(function(){
                    v.auth.updateLastActiveTimestamp();
                    resolve();
                })['catch'](function(error){
                    reject(error);
                });
            });
        },

        /**
         * Get all devices reporting on realm/account
         *
         * @alias getRunningDevices
         * @param {Object} params params
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         */
        getRunningDevices: function(params){
            return new Promise(function(resolve, reject) {
                params = params ? params : {};
                v.checkHost(params);

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealm(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                utils.validateRequiredId(params, reject);

                var url = utils.getRealmResourceURL(v.deviceURL, account, realm,'/running', token, params.ssl);

                v.$.getJSON(url).then(function(devices){
                    v.auth.updateLastActiveTimestamp();
                    resolve(devices);
                })['catch'](function(error){
                    reject(error);
                });
            });
        }

    };
}