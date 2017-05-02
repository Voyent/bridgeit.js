if (!window.voyent) {
    window.voyent = {};
}

(function (v) {
    var privateUtils = PrivateUtils(v);
    v.$ = PublicUtils(privateUtils);

    var TRANSACTION_KEY = 'bridgeitTransaction';

    v.configureHosts = function (url) {
        var isLocal = ['localhost', '127.0.0.1'].indexOf(url) > -1;
        if (!url) {
            v.baseURL = 'latest.voyent.cloud';
        }
        else {
            v.baseURL = url;
        }
        var baseURL = v.baseURL;
        v.authURL = baseURL + (isLocal ? ':55010' : '') + '/auth';
        v.authAdminURL = baseURL + (isLocal ? ':55010' : '') + '/authadmin';
        v.locateURL = baseURL + (isLocal ? ':55020' : '') + '/locate';
        v.documentsURL = baseURL + (isLocal ? ':55080' : '') + '/docs';
        v.storageURL = baseURL + (isLocal ? ':55030' : '') + '/storage';
        v.metricsURL = baseURL + (isLocal ? ':55040' : '') + '/metrics';
        v.contextURL = baseURL + (isLocal ? ':55060' : '') + '/context';
        v.codeURL = baseURL + (isLocal ? ':55090' : '') + '/code';
        v.pushURL = baseURL + (isLocal ? ':8080' : '') + '/notify';
        v.pushRESTURL = v.pushURL + '/rest';
        v.queryURL = baseURL + (isLocal ? ':55110' : '') + '/query';
        v.actionURL = baseURL + (isLocal ? ':55130' : '') + '/action';
        v.eventhubURL = baseURL + (isLocal ? ':55200' : '') + '/eventhub';
        v.mailboxURL = baseURL + (isLocal ? ':55120' : '') + '/mailbox';
        v.deviceURL = baseURL + (isLocal ? ':55160' : '') + '/device';
    };
    v.checkHost = function (params) {
        //TODO use last configured host if available
        if (params.host) {
            v.configureHosts(params.host);
        }
    };
    v.startTransaction = function () {
        privateUtils.setSessionStorageItem(btoa(TRANSACTION_KEY), v.$.newUUID());
        console.log('bridgeit: started transaction ' + v.getLastTransactionId());
    };
    v.endTransaction = function () {
        privateUtils.removeSessionStorageItem(btoa(TRANSACTION_KEY));
        console.log('bridgeit: ended transaction ' + v.getLastTransactionId());
    };
    v.getLastTransactionId = function () {
        return privateUtils.getSessionStorageItem(btoa(TRANSACTION_KEY));
    };

    v.action = ActionService(v, privateUtils);
    v.admin = AdminService(v, privateUtils);
    v.auth = AuthService(v, privateUtils);
    v.documents = DocService(v, privateUtils);
    v.eventhub = EventHubService(v, privateUtils);
    v.location = LocateService(v, privateUtils);
    v.mailbox = MailboxService(v, privateUtils);
    v.metrics = MetricsService(v, privateUtils);
    v.push = PushService(v, privateUtils);
    v.context = ContextService(v, privateUtils);
    v.code = CodeService(v, privateUtils);
    v.storage = StorageService(v, privateUtils);
    v.query = QueryService(v, privateUtils);
    v.device = DeviceService(v, privateUtils);

    /* Initialization */
    v.configureHosts();

    /* check connect settings */
    if (v.auth.isLoggedIn()) {
        var connectSettings = v.auth.getConnectSettings();
        if (connectSettings) {
            //user is logged in and has connect settings, so reconnect
            v.auth.connect(connectSettings);
        }
    }
})(voyent);
