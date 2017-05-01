function DeviceService(b, utils) {
    var services = b.io;

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
                services.checkHost(params);

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealm(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                utils.validateRequiredId(params, reject);

                var url = utils.getRealmResourceURL(services.deviceURL, account, realm,
                    params.macAddress+'/start', token, params.ssl);

                b.$.put(url, {}).then(function(){
                    services.auth.updateLastActiveTimestamp();
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
                services.checkHost(params);

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealm(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                utils.validateRequiredId(params, reject);

                var url = utils.getRealmResourceURL(services.deviceURL, account, realm,
                    params.macAddress+'/stop', token, params.ssl);

                b.$.put(url, {}).then(function(){
                    services.auth.updateLastActiveTimestamp();
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
                services.checkHost(params);

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealm(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                utils.validateRequiredId(params, reject);

                var url = utils.getRealmResourceURL(services.deviceURL, account, realm,'/stop', token, params.ssl);

                b.$.put(url, {}).then(function(){
                    services.auth.updateLastActiveTimestamp();
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
                services.checkHost(params);

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealm(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                utils.validateRequiredId(params, reject);

                var url = utils.getRealmResourceURL(services.deviceURL, account, realm,'/running', token, params.ssl);

                b.$.getJSON(url).then(function(devices){
                    services.auth.updateLastActiveTimestamp();
                    resolve(devices);
                })['catch'](function(error){
                    reject(error);
                });
            });
        }

    };
}