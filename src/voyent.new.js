if (!window.voyent) {
    window.voyent = {};
}

(function (b) {
    if (!b['io']) {
        b.io = {};
    }
    var services = b.io;
    var utils = PrivateUtils(services);
    b.$ = PublicUtils(utils);

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
        setSessionStorageItem(btoa(TRANSACTION_KEY), b.$.newUUID());
        console.log('bridgeit: started transaction ' + services.getLastTransactionId());
    };
    services.endTransaction = function () {
        removeSessionStorageItem(btoa(TRANSACTION_KEY));
        console.log('bridgeit: ended transaction ' + services.getLastTransactionId());
    };
    services.getLastTransactionId = function () {
        return getSessionStorageItem(btoa(TRANSACTION_KEY));
    };

    services.action = ActionService(b, utils);
    services.admin = AdminService(b, utils);
    services.auth = AuthService(b, utils);
    services.documents = DocService(b, utils);
    services.eventhub = EventHubService(b, utils);
    services.location = LocateService(b, utils);
    services.mailbox = MailboxService(b, utils);
    services.metrics = MetricsService(b, utils);
    services.push = PushService(b, utils);
    services.context = ContextService(b, utils);
    services.code = CodeService(b, utils);
    services.storage = StorageService(b, utils);
    services.query = QueryService(b, utils);
    services.device = DeviceService(b, utils);

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
