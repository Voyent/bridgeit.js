if (!window.voyent) {
    window.voyent = {};
}

(function (v) {
    if (!v['io']) {
        v.io = {};
    }
    var services = v.io;
    var privateUtils = PrivateUtils(services);
    v.$ = PublicUtils(privateUtils);

    var TRANSACTION_KEY = 'bridgeitTransaction';

    services.configureHosts = function (url) {
        var isLocal = ['localhost', '127.0.0.1'].indexOf(url) > -1;
        if (!url) {
            services.baseURL = 'latest.voyent.cloud';
        }
        else {
            services.baseURL = url;
        }
        var baseURL = services.baseURL;
        services.authURL = baseURL + (isLocal ? ':55010' : '') + '/auth';
        services.authAdminURL = baseURL + (isLocal ? ':55010' : '') + '/authadmin';
        services.locateURL = baseURL + (isLocal ? ':55020' : '') + '/locate';
        services.documentsURL = baseURL + (isLocal ? ':55080' : '') + '/docs';
        services.storageURL = baseURL + (isLocal ? ':55030' : '') + '/storage';
        services.metricsURL = baseURL + (isLocal ? ':55040' : '') + '/metrics';
        services.contextURL = baseURL + (isLocal ? ':55060' : '') + '/context';
        services.codeURL = baseURL + (isLocal ? ':55090' : '') + '/code';
        services.pushURL = baseURL + (isLocal ? ':8080' : '') + '/notify';
        services.pushRESTURL = services.pushURL + '/rest';
        services.queryURL = baseURL + (isLocal ? ':55110' : '') + '/query';
        services.actionURL = baseURL + (isLocal ? ':55130' : '') + '/action';
        services.eventhubURL = baseURL + (isLocal ? ':55200' : '') + '/eventhub';
        services.mailboxURL = baseURL + (isLocal ? ':55120' : '') + '/mailbox';
        services.deviceURL = baseURL + (isLocal ? ':55160' : '') + '/device';
    };
    services.checkHost = function (params) {
        //TODO use last configured host if available
        if (params.host) {
            services.configureHosts(params.host);
        }
    };
    services.startTransaction = function () {
        privateUtils.setSessionStorageItem(btoa(TRANSACTION_KEY), v.$.newUUID());
        console.log('bridgeit: started transaction ' + services.getLastTransactionId());
    };
    services.endTransaction = function () {
        privateUtils.removeSessionStorageItem(btoa(TRANSACTION_KEY));
        console.log('bridgeit: ended transaction ' + services.getLastTransactionId());
    };
    services.getLastTransactionId = function () {
        return privateUtils.getSessionStorageItem(btoa(TRANSACTION_KEY));
    };

    services.action = ActionService(v, privateUtils);
    services.admin = AdminService(v, privateUtils);
    services.auth = AuthService(v, privateUtils);
    services.documents = DocService(v, privateUtils);
    services.eventhub = EventHubService(v, privateUtils);
    services.location = LocateService(v, privateUtils);
    services.mailbox = MailboxService(v, privateUtils);
    services.metrics = MetricsService(v, privateUtils);
    services.push = PushService(v, privateUtils);
    services.context = ContextService(v, privateUtils);
    services.code = CodeService(v, privateUtils);
    services.storage = StorageService(v, privateUtils);
    services.query = QueryService(v, privateUtils);
    services.device = DeviceService(v, privateUtils);

    /* Initialization */
    services.configureHosts();

    /* check connect settings */
    if (services.auth.isLoggedIn()) {
        var connectSettings = services.auth.getConnectSettings();
        if (connectSettings) {
            //user is logged in and has connect settings, so reconnect
            services.auth.connect(connectSettings);
        }
    }
})(voyent);
