if (!window.ice) {
    window.ice = new Object;
}
if (!window.ice.icepush) {
    (function(namespace) {
        window.ice.icepush = true;
        eval(ice.importFrom('ice.lib.functional'));
        eval(ice.importFrom('ice.lib.oo'));
        eval(ice.importFrom('ice.lib.collection'));
        eval(ice.importFrom('ice.lib.string'));
        eval(ice.importFrom('ice.lib.delay'));
        eval(ice.importFrom('ice.lib.cookie'));
        eval(ice.importFrom('ice.lib.window'));
        eval(ice.importFrom('ice.lib.event'));
        eval(ice.importFrom('ice.lib.element'));
        eval(ice.importFrom('ice.lib.logger'));
        eval(ice.importFrom('ice.lib.query'));
        eval(ice.importFrom('ice.lib.http'));
        eval(ice.importFrom('ice.lib.configuration'));
        var ffMatch = navigator.userAgent.match(/Firefox\/(\w\.?\w)/);
        var firefoxGreaterThan3point6 = ffMatch ? (Number(ffMatch[1]) > 3.6) : true;
        var ie = window.attachEvent || /Trident.*rv\:11\./.test(navigator.userAgent) || /MSIE/.test(navigator.userAgent);
        function useLocalStorage() {
            var workingLocalStorage = false;
            if (window.localStorage) {
                var key = 'testLocalStorage';
                var value = String(Math.random());
                try {
                    window.localStorage[key] = value;
                    workingLocalStorage = window.localStorage[key] == value;
                } catch (ex) {
                    return false;
                } finally {
                    window.localStorage.removeItem(key);
                }
            }
            return workingLocalStorage && firefoxGreaterThan3point6 && !ie;
        }
        function detectByReference(ref) {
            return function (o) {
                return o == ref;
            };
        }
        function removeCallbackCallback(callbackList, detector) {
            return function removeCallback() {
                var temp = reject(callbackList, detector);
                empty(callbackList);
                each(temp, curry(append, callbackList));
            }
        }
        function CREATED(response) {
            return statusCode(response) == 201;
        }
        function NOCONTENT(response) {
            return statusCode(response) == 204;
        }
        function NOTFOUND(response) {
            return statusCode(response) == 404;
        }
        var register = operator();
        var deserializeAndExecute = operator();
        function CommandDispatcher() {
            var commands = [];
            function executeCommand(name, parameter) {
                var found = detect(commands, function(cell) {
                    return key(cell) == name;
                });
                if (found) {
                    value(found)(parameter);
                }
            }
            return object(function(method) {
                method(register, function(self, messageName, command) {
                    commands = reject(commands, function(cell) {
                        return key(cell) == messageName;
                    });
                    append(commands, Cell(messageName, command));
                });
                method(deserializeAndExecute, function(self, content) {
                    try {
                        var result = JSON.parse(content);
                        if (result.noop) {
                            executeCommand('noop',[]);
                        }
                        if (result.notifications) {
                            executeCommand('notifications', result.notifications);
                        }
                        if (result.configuration) {
                            executeCommand('configuration', result.configuration);
                        }
                        if (result.browser) {
                            executeCommand('browser', result.browser);
                        }
                    } catch (e) {
                        executeCommand('error', e);
                    }
                });
            });
        }
        function NoopCommand() {
            debug(namespace.logger, 'received noop');
        }
        function CommandError(err) {
            error(namespace.logger, 'error');
            error(namespace.logger, err);
        }
        var setValue = operator();
        var getValue = operator();
        var removeSlot = operator();
        var existsSlot;
        var Slot;
        (function () {
            var slots = {};
            var WindowSlot = function (name, val) {
                slots[name] = val || '';
                return object(function (method) {
                    method(getValue, function (self) {
                        var value = slots[name];
                        return value ? value : '';
                    });
                    method(setValue, function (self, val) {
                        slots[name] = val;
                    });
                    method(removeSlot, function(self) {
                        delete slots[name];
                    });
                });
            };
            var existsWindowSlot = function (name) {
                return slots[name] != null;
            };
            var BrowserSlot;
            var existsBrowserSlot;
            var removeBrowserSlot;
            if (useLocalStorage()) {
                BrowserSlot = function LocalStorageSlot(name, val) {
                    window.localStorage.setItem(name, window.localStorage.getItem(name) || '');
                    return object(function (method) {
                        method(getValue, function (self) {
                            var val = window.localStorage.getItem(name);
                            return val ? val : '';
                        });
                        method(setValue, function (self, val) {
                            window.localStorage.setItem(name, val || '');
                        });
                        method(removeSlot, function(self) {
                            window.localStorage.removeItem(name);
                        });
                    });
                };
                existsBrowserSlot = function (name) {
                    return window.localStorage.getItem(name) != null;
                };
            } else {
                BrowserSlot = function CookieSlot(name, val) {
                    var c = existsCookie(name) ? lookupCookie(name) : Cookie(name, val);
                    return object(function (method) {
                        method(getValue, function (self) {
                            try {
                                return value(c);
                            } catch (e) {
                                c = Cookie(name, '');
                                return '';
                            }
                        });
                        method(setValue, function (self, val) {
                            try {
                                update(c, val);
                            } catch (e) {
                                c = Cookie(name, val);
                            }
                        });
                        method(removeSlot, function(self) {
                            if (existsCookie(name)) {
                                remove(lookupCookie(name));
                            }
                        });
                    });
                };
                existsBrowserSlot = existsCookie;
            }
            function nonSharedSlot() {
                return namespace.push && namespace.push.configuration && namespace.push.configuration.nonSharedConnection;
            }
            Slot = function (name, val) {
                return object(function (method) {
                    var slot;
                    var previousSharingType;
                    function acquireSlot() {
                        var currentSharingType = nonSharedSlot();
                        var oldVal;
                        if (slot) {
                            oldVal = getValue(slot);
                        }
                        if (previousSharingType != currentSharingType || !slot) {
                            slot = currentSharingType ? WindowSlot(name) : BrowserSlot(name);
                            previousSharingType = currentSharingType;
                        }
                        if (oldVal) {
                            setValue(slot, oldVal);
                        }
                        return slot;
                    }
                    method(getValue, function (self) {
                        return getValue(acquireSlot());
                    });
                    method(setValue, function (self, val) {
                        setValue(acquireSlot(), val);
                    });
                    method(removeSlot, function(self) {
                        removeSlot(acquireSlot());
                    });
                });
            };
            existsSlot = function (name) {
                return nonSharedSlot() ? existsWindowSlot(name) : existsBrowserSlot(name);
            };
        }());
        var send = operator();
        var onSend = operator();
        var onReceive = operator();
        var onServerError = operator();
        var whenDown = operator();
        var whenTrouble = operator();
        var whenStopped = operator();
        var whenReEstablished = operator();
        var startConnection = operator();
        var resumeConnection = operator();
        var pauseConnection = operator();
        var reconfigure = operator();
        var shutdown = operator();
        var AsyncConnection;
        (function() {
            var SequenceNumber = 'ice.push.sequence';
            var ConnectionRunning = 'ice.connection.running';
            var ConnectionLease = 'ice.connection.lease';
            var AcquiredMarker = ':acquired';
            var NetworkDelay = 5000;
            var DefaultConfiguration = {
                heartbeat:{
                    interval: 6500
                },
                network_error_retry_timeouts: [1, 1, 1, 2, 2, 3],
                server_error_handler: {
                    delays: "1000, 2000, 4000"
                },
                response_timeout_handler: {
                    retries: 3
                }
            };
            function timedRetryAbort(retryAction, abortAction, timeouts) {
                var index = 0;
                var errorActions = inject(timeouts, [abortAction], function(actions, interval) {
                    return insert(actions, curry(runOnce, Delay(retryAction, interval)));
                });
                return function() {
                    if (index < errorActions.length) {
                        apply(errorActions[index], arguments);
                        index++;
                    }
                };
            }
            AsyncConnection = function(logger, windowID, mainConfiguration) {
                var logger = childLogger(logger, 'async-connection');
                var channel = Client(false);
                var onSendListeners = [];
                var onReceiveListeners = [];
                var onServerErrorListeners = [];
                var connectionDownListeners = [];
                var connectionTroubleListeners = [];
                var connectionStoppedListeners = [];
                var connectionReEstablished = [];
                var sequenceNo = Slot(SequenceNumber);
                var configuration = mainConfiguration.configuration || DefaultConfiguration;
                var heartbeatTimestamp = (new Date()).getTime();
                var listener = object(function(method) {
                    method(close, noop);
                    method(abort, noop);
                });
                onBeforeUnload(window, function() {
                    connectionDownListeners = [];
                });
                var lastSentPushIds = registeredPushIds();
                function requestForBlockingResponse() {
                    try {
                        debug(logger, "closing previous connection...");
                        close(listener);
                        lastSentPushIds = registeredPushIds();
                        if (isEmpty(lastSentPushIds)) {
                            stopTimeoutBombs();
                            broadcast(connectionStoppedListeners, ['connection stopped, no pushIDs registered']);
                        } else {
                            debug(logger, 'connect...');
                            var uri = mainConfiguration.uri + mainConfiguration.account + '/realms/' + mainConfiguration.realm + '/push-ids?access_token=' + encodeURIComponent(namespace.access_token) + '&op=listen';
                            var body = JSON.stringify({
                                'access_token': namespace.access_token,
                                'browser': lookupCookieValue(BrowserIDName),
                                'heartbeat': {
                                    'timestamp': heartbeatTimestamp,
                                    'interval': heartbeatInterval
                                },
                                'op': 'listen',
                                'sequence_number': Number(getValue(sequenceNo) || '0'),
                                'window': namespace.windowID,
                                'push_ids': lastSentPushIds
                            });
                            listener = postAsynchronously(channel, uri, body, JSONRequest, $witch(function (condition) {
                                condition(OK, function (response) {
                                    var content = contentAsText(response);
                                    var reconnect = getHeader(response, 'X-Connection') != 'close';
                                    var nonEmptyResponse = notEmpty(content);
                                    if (reconnect) {
                                        if (nonEmptyResponse) {
                                            try {
                                                var result = JSON.parse(content);
                                                if (result.sequence_number) {
                                                    setValue(sequenceNo, result.sequence_number);
                                                }
                                                if (result.heartbeat && result.heartbeat.timestamp) {
                                                    heartbeatTimestamp = result.heartbeat.timestamp;
                                                }
                                                if (result.heartbeat && result.heartbeat.interval) {
                                                    if (heartbeatInterval != result.heartbeat.interval) {
                                                        heartbeatInterval = result.heartbeat.interval;
                                                        adjustTimeoutBombIntervals();
                                                    }
                                                }
                                            } finally {
                                                broadcast(onReceiveListeners, [response]);
                                                resetEmptyResponseRetries();
                                            }
                                        } else {
                                            warn(logger, 'empty response received');
                                            decrementEmptyResponseRetries();
                                        }
                                        if (anyEmptyResponseRetriesLeft()) {
                                            resetTimeoutBomb();
                                            connect();
                                        } else {
                                            info(logger, 'blocking connection stopped, too many empty responses received...');
                                        }
                                    } else {
                                        info(logger, 'blocking connection stopped at server\'s request...');
                                        var reason = getHeader(response, 'X-Connection-reason');
                                        if (reason) {
                                            info(logger, reason);
                                        }
                                        stopTimeoutBombs();
                                        broadcast(connectionStoppedListeners, ['connection stopped by server']);
                                    }
                                });
                                condition(ServerInternalError, retryOnServerError);
                            }));
                        }
                    } catch (e) {
                        error(logger, 'failed to re-initiate blocking connection', e);
                    }
                }
                var connect = requestForBlockingResponse;
                var heartbeatInterval;
                var networkErrorRetryTimeouts;
                function setupNetworkErrorRetries(cfg) {
                    heartbeatInterval = cfg.heartbeat.interval || DefaultConfiguration.heartbeat.interval;
                    networkErrorRetryTimeouts = cfg.network_error_retry_timeouts || DefaultConfiguration.network_error_retry_timeouts;
                    emptyResponseRetries = cfg.response_timeout_handler.retries || DefaultConfiguration.response_timeout_handler.retries;
                }
                setupNetworkErrorRetries(configuration);
                var serverErrorRetryTimeouts;
                var retryOnServerError;
                function setupServerErrorRetries(cfg) {
                    serverErrorRetryTimeouts = collect(split(cfg.server_error_handler && cfg.server_error_handler.delays ? cfg.server_error_handler.delays : DefaultConfiguration.server_error_retry_timeouts, ' '), Number);
                    retryOnServerError = timedRetryAbort(connect, broadcaster(onServerErrorListeners), serverErrorRetryTimeouts);
                }
                setupServerErrorRetries(configuration);
                var emptyResponseRetries;
                function resetEmptyResponseRetries() {
                    emptyResponseRetries = configuration.response_timeout_handler.retries || DefaultConfiguration.response_timeout_handler.retries;
                }
                function decrementEmptyResponseRetries() {
                    --emptyResponseRetries;
                }
                function anyEmptyResponseRetriesLeft() {
                    return emptyResponseRetries > 0;
                }
                resetEmptyResponseRetries();
                var initialRetryIndex = function () {
                    return 0;
                };
                var pendingRetryIndex = initialRetryIndex;
                var stopTimeoutBombs = noop;
                function chainTimeoutBombs(timeoutAction, abortAction, intervals, remainingBombsIndex) {
                    var index = remainingBombsIndex();
                    stopTimeoutBombs();
                    function sparkTimeoutBomb() {
                        var run = true;
                        var timeoutBomb = runOnce(Delay(function() {
                            if (run) {
                                var retryCount = intervals.length;
                                if (index < retryCount) {
                                    timeoutAction(++index, retryCount);
                                    stopTimeoutBombs = sparkTimeoutBomb();
                                } else {
                                    abortAction();
                                }
                            }
                        }, intervals[index]));
                        return function() {
                            run = false;
                            stop(timeoutBomb);
                        }
                    }
                    stopTimeoutBombs = sparkTimeoutBomb();
                    return function() {
                        return index;
                    }
                }
                function recalculateRetryIntervals() {
                    return asArray(collect(networkErrorRetryTimeouts, function (factor) {
                        return factor * heartbeatInterval + NetworkDelay;
                    }));
                }
                function networkErrorRetry(i, retries) {
                    warn(logger, 'failed to connect ' + i + ' time' + (i > 1 ? 's' : '') + (i < retries ? ', retrying ...' : ''));
                    broadcast(connectionTroubleListeners);
                    connect();
                }
                function networkFailure() {
                    broadcast(connectionDownListeners);
                }
                function resetTimeoutBomb() {
                    pendingRetryIndex = chainTimeoutBombs(networkErrorRetry, networkFailure, recalculateRetryIntervals(), initialRetryIndex);
                }
                function adjustTimeoutBombIntervals() {
                    pendingRetryIndex = chainTimeoutBombs(networkErrorRetry, networkFailure, recalculateRetryIntervals(), pendingRetryIndex);
                }
                function initializeConnection() {
                    info(logger, 'initialize connection within window ' + namespace.windowID);
                    resetTimeoutBomb();
                    setValue(sequenceNo, Number(getValue(sequenceNo)) + 1);
                    connect();
                }
                var pollingPeriod = 1000;
                var leaseSlot = Slot(ConnectionLease, asString((new Date).getTime()));
                var connectionSlot = Slot(ConnectionRunning);
                function updateLease() {
                    setValue(leaseSlot, (new Date).getTime() + pollingPeriod * 3);
                }
                function isLeaseExpired() {
                    return asNumber(getValue(leaseSlot)) < (new Date).getTime();
                }
                function shouldEstablishBlockingConnection() {
                    return !existsSlot(ConnectionRunning) || isEmpty(getValue(connectionSlot));
                }
                function offerCandidature() {
                    setValue(connectionSlot, windowID);
                }
                function isWinningCandidate() {
                    return startsWith(getValue(connectionSlot), windowID);
                }
                function markAsOwned() {
                    setValue(connectionSlot, windowID + AcquiredMarker);
                }
                function isOwner() {
                    return getValue(connectionSlot) == (windowID + AcquiredMarker);
                }
                function hasOwner() {
                    return endsWith(getValue(connectionSlot), AcquiredMarker);
                }
                function owner() {
                    var owner = getValue(connectionSlot);
                    var i = indexOf(owner, AcquiredMarker);
                    return i > -1 ? substring(owner, 0, i) : owner;
                }
                var lastOwningWindow = '';
                var paused = false;
                var blockingConnectionMonitor = object(function(method) {
                    method(stop, noop);
                });
                function createBlockingConnectionMonitor() {
                    blockingConnectionMonitor = run(Delay(function() {
                        if (shouldEstablishBlockingConnection()) {
                            offerCandidature();
                            info(logger, 'blocking connection not initialized...candidate for its creation');
                        } else {
                            if (isWinningCandidate()) {
                                if (!hasOwner()) {
                                    markAsOwned();
                                    if (notEmpty(registeredPushIds())) {
                                        initializeConnection();
                                    }
                                }
                                updateLease();
                            }
                            if (isLeaseExpired()) {
                                setTimeout(offerCandidature, 1.5 * Math.random() * pollingPeriod);
                                info(logger, 'blocking connection lease expired...candidate for its creation');
                            }
                        }
                        if (isOwner()) {
                            var ids = registeredPushIds();
                            if ((size(ids) != size(lastSentPushIds)) || notEmpty(complement(ids, lastSentPushIds))) {
                                abort(listener);
                                connect();
                            }
                        } else {
                            stopTimeoutBombs();
                            abort(listener);
                        }
                        var currentlyOwningWindow = getValue(connectionSlot);
                        if (hasOwner()) {
                            if (lastOwningWindow != currentlyOwningWindow) {
                                lastOwningWindow = currentlyOwningWindow;
                                broadcast(connectionReEstablished, [ owner() ]);
                            }
                        } else {
                            lastOwningWindow = '';
                        }
                    }, pollingPeriod));
                }
                return object(function(method) {
                    method(onSend, function(self, callback) {
                        append(onSendListeners, callback);
                    });
                    method(onReceive, function(self, callback) {
                        append(onReceiveListeners, callback);
                    });
                    method(onServerError, function(self, callback) {
                        append(onServerErrorListeners, callback);
                    });
                    method(whenDown, function(self, callback) {
                        append(connectionDownListeners, callback);
                    });
                    method(whenTrouble, function(self, callback) {
                        append(connectionTroubleListeners, callback);
                    });
                    method(whenStopped, function(self, callback) {
                        append(connectionStoppedListeners, callback);
                    });
                    method(whenReEstablished, function(self, callback) {
                        append(connectionReEstablished, callback);
                    });
                    method(startConnection, function(self) {
                        createBlockingConnectionMonitor();
                        info(logger, 'connection monitoring started within window ' + namespace.windowID);
                        paused = false;
                    });
                    method(resumeConnection, function(self) {
                        if (paused) {
                            connect = requestForBlockingResponse;
                            initializeConnection();
                            createBlockingConnectionMonitor();
                            paused = false;
                        }
                    });
                    method(pauseConnection, function(self) {
                        if (not(paused)) {
                            abort(listener);
                            stop(blockingConnectionMonitor);
                            stopTimeoutBombs();
                            connect = noop;
                            paused = true;
                            broadcast(connectionStoppedListeners, ['connection stopped']);
                        }
                    });
                    method(reconfigure, function(self, configuration) {
                        setupNetworkErrorRetries(configuration);
                        adjustTimeoutBombIntervals();
                        setupServerErrorRetries(configuration);
                    });
                    method(shutdown, function(self) {
                        try {
                            method(shutdown, noop);
                            connect = noop;
                            resetTimeoutBomb = noop;
                        } catch (e) {
                            error(logger, 'error during shutdown', e);
                        } finally {
                            broadcast(connectionStoppedListeners, ['connection stopped']);
                            onReceiveListeners = connectionDownListeners = onServerErrorListeners = connectionStoppedListeners = [];
                            abort(listener);
                            stopTimeoutBombs();
                            stop(blockingConnectionMonitor);
                            if (isOwner()) {
                                removeSlot(connectionSlot);
                            }
                        }
                    });
                });
            };
        })();
        var notifyWindows = operator();
        var disposeBroadcast = operator();
        function LocalStorageNotificationBroadcaster(name, callback) {
            var RandomSeparator = ':::';
            var PayloadSeparator = '%%%';
            if (!window.localStorage.getItem(name)) {
                window.localStorage.setItem(name, '');
            }
            function storageListener(e) {
                var newValue = e.newValue;
                if (e.key == name && newValue) {
                    var idsAndPayload = split(newValue, RandomSeparator)[0];
                    var tuple = split(idsAndPayload, PayloadSeparator);
                    var ids = split(tuple[0], ' ');
                    var payload = tuple[1];
                    callback(ids, payload);
                }
            }
            if (window.addEventListener) {
                window.addEventListener('storage', storageListener, false);
            } else {
                document.attachEvent('onstorage', storageListener);
            }
            return object(function(method) {
                method(notifyWindows, function(self, ids, payload) {
                    var newValue = join(ids, ' ') + PayloadSeparator + payload;
                    window.localStorage.setItem(name, newValue + RandomSeparator + Math.random());
                    var agent = navigator.userAgent;
                    if (!/MSIE/.test(agent) && !/Trident/.test(agent)) {
                        callback(ids, payload);
                    }
                });
                method(disposeBroadcast, noop);
            });
        }
        function CookieBasedNotificationBroadcaster(name, callback) {
            var NotificationSeparator = ':::';
            var PayloadSeparator = '%%%';
            var notificationsBucket = lookupCookie(name, function() {
                return Cookie(name, '');
            });
            var notificationMonitor = run(Delay(function() {
                try {
                    var unparsedPushIDs = value(notificationsBucket) || '';
                    var notifications = split(unparsedPushIDs, NotificationSeparator);
                    var remainingNotifications = join(inject(notifications, [], function(result, notification) {
                        var tuple = split(notification, PayloadSeparator);
                        var ids = split(tuple[0], ' ');
                        var payload = tuple[1] || '';
                        if (notEmpty(ids)) {
                            var notifiedIDs = callback(ids, payload);
                            var remainingIDs = complement(ids, notifiedIDs);
                            if (notEmpty(remainingIDs)) {
                                append(result, join(notifiedIDs, ' ') + PayloadSeparator + payload);
                            }
                        }
                        return result;
                    }), NotificationSeparator);
                    update(notificationsBucket, remainingNotifications);
                } catch (e) {
                    warn(namespace.logger, 'failed to listen for updates', e);
                }
            }, 300));
            return object(function(method) {
                method(notifyWindows, function(self, receivedPushIDs, payload) {
                    var notifications = asArray(split(value(notificationsBucket), NotificationSeparator));
                    var newNotification = join(receivedPushIDs, ' ') + PayloadSeparator + (payload || '');
                    append(notifications, newNotification);
                    var newNotifications = join(notifications, NotificationSeparator);
                    update(notificationsBucket, newNotifications);
                    if (size(value(notificationsBucket)) != size(newNotifications)) {
                        warn(namespace.logger, 'notifications were dropped because of the cookie size limitation');
                    }
                });
                method(disposeBroadcast, function(self) {
                    stop(notificationMonitor);
                });
            });
        }
        var resumePushIDExpiry = operator();
        var stopPushIDExpiry = operator();
        var PushIDExpiryMonitor;
        (function () {
            if (useLocalStorage()) {
                PushIDExpiryMonitor = function(parentLogger) {
                    var logger = childLogger(parentLogger, 'pushid-expiry');
                    var notificationResponsivness = {};
                    var testChannel = "ice.push.liveliness";
                    var testLivelinessBroadcaster = LocalStorageNotificationBroadcaster(testChannel, function (verifiedIds) {
                        var ids = registeredWindowPushIds();
                        var confirmedIds = intersect(verifiedIds, ids);
                        if (notEmpty(confirmedIds)) {
                            notifyWindows(confirmLivelinessBroadcaster, ids);
                        }
                    });
                    var confirmationChannel = "ice.push.confirm";
                    var confirmLivelinessBroadcaster = LocalStorageNotificationBroadcaster(confirmationChannel, function (confirmedIDs) {
                        each(confirmedIDs, function (id) {
                            delete notificationResponsivness[id];
                        });
                    });
                    function requestConfirmLiveliness() {
                        var ids = registeredPushIds();
                        var discardUnresponsiveIds = [];
                        for (var id in notificationResponsivness) {
                            if (notificationResponsivness.hasOwnProperty(id)) {
                                if (not(contains(ids, id))) {
                                    append(discardUnresponsiveIds, id);
                                }
                            }
                        }
                        each(discardUnresponsiveIds, function (id) {
                            delete notificationResponsivness[id];
                        });
                        each(ids, function (id) {
                            var count = notificationResponsivness[id];
                            if (count) {
                                notificationResponsivness[id] = count + 1;
                            } else {
                                notificationResponsivness[id] = 1;
                            }
                        });
                        if (notEmpty(ids)) {
                            notifyWindows(testLivelinessBroadcaster, ids);
                        }
                        return notificationResponsivness;
                    }
                    function removeUnusedPushIDs() {
                        var unresponsivePushIds = requestConfirmLiveliness();
                        var ids = [];
                        for (var p in unresponsivePushIds) {
                            if (unresponsivePushIds.hasOwnProperty(p) && unresponsivePushIds[p] > 5) {
                                append(ids, p);
                            }
                        }
                        if (notEmpty(ids)) {
                            info(logger, 'expirying unused pushIDs: ' + ids);
                            delistPushIDsWithBrowser(ids);
                        }
                    }
                    var pid = object(function (method) {
                        method(stop, noop);
                    });
                    return object(function (method) {
                        method(resumePushIDExpiry, function (self) {
                            info(logger, 'resume monitoring for unused pushIDs');
                            pid = Delay(removeUnusedPushIDs, 10000);
                            run(pid);
                        });
                        method(stopPushIDExpiry, function (self) {
                            info(logger, 'stopped monitoring for unused pushIDs');
                            stop(pid);
                        });
                    });
                };
            } else {
                PushIDExpiryMonitor = function () {
                    return object(function (method) {
                        method(resumePushIDExpiry, noop);
                        method(stopPushIDExpiry, noop);
                    });
                };
            }
        })();
        var notificationListeners = [];
        namespace.onNotification = function (callback) {
            append(notificationListeners, callback);
            return removeCallbackCallback(notificationListeners, detectByReference(callback));
        };
        var receiveListeners = [];
        namespace.onBlockingConnectionReceive = function (callback) {
            append(receiveListeners, callback);
            return removeCallbackCallback(receiveListeners, detectByReference(callback));
        };
        var serverErrorListeners = [];
        namespace.onBlockingConnectionServerError = function (callback) {
            append(serverErrorListeners, callback);
            return removeCallbackCallback(serverErrorListeners, detectByReference(callback));
        };
        var blockingConnectionUnstableListeners = [];
        namespace.onBlockingConnectionUnstable = function (callback) {
            append(blockingConnectionUnstableListeners, callback);
            return removeCallbackCallback(blockingConnectionUnstableListeners, detectByReference(callback));
        };
        var blockingConnectionLostListeners = [];
        namespace.onBlockingConnectionLost = function (callback) {
            append(blockingConnectionLostListeners, callback);
            return removeCallbackCallback(blockingConnectionLostListeners, detectByReference(callback));
        };
        var blockingConnectionReEstablishedListeners = [];
        namespace.onBlockingConnectionReEstablished = function (callback) {
            append(blockingConnectionReEstablishedListeners, callback);
            return removeCallbackCallback(blockingConnectionReEstablishedListeners, detectByReference(callback));
        };
        var PushID = 'ice.pushid';
        var PushIDs = 'ice.pushids';
        var BrowserIDName = 'ice.push.browser';
        var WindowID = 'ice.push.window';
        var NotifiedPushIDs = 'ice.notified.pushids';
        var HeartbeatTimestamp = 'ice.push.heartbeatTimestamp';
        var handler = LocalStorageLogHandler(window.console ? ConsoleLogHandler(debug) : WindowLogHandler(debug, window.location.href));
        namespace.windowID = namespace.windowID || substring(Math.random().toString(16), 2, 7);
        namespace.logger = Logger(['icepush'], handler);
        namespace.info = info;
        var pushIdentifiers = [];
        function registeredWindowPushIds() {
            return pushIdentifiers;
        }
        var pushIDsSlot = Slot(PushIDs);
        function registeredPushIds() {
            try {
                return split(getValue(pushIDsSlot), ' ');
            } catch (e) {
                return [];
            }
        }
        function enlistPushIDsWithBrowser(ids) {
            var registeredIDs = split(getValue(pushIDsSlot), ' ');
            try {
                lookupCookieValue(BrowserIDName)
            } catch (ex) {
                try {
                    var id = ids[0].split(':')[0];
                    Cookie(BrowserIDName, id);
                } catch (ex) {
                    error(namespace.logger, 'Failed to extract browser ID from push ID.');
                }
            }
            setValue(pushIDsSlot, join(asSet(concatenate(registeredIDs, ids)), ' '));
        }
        function delistPushIDsWithBrowser(ids) {
            if (existsSlot(PushIDs)) {
                var registeredIDs = split(getValue(pushIDsSlot), ' ');
                setValue(pushIDsSlot, join(complement(registeredIDs, ids), ' '));
            }
        }
        function enlistPushIDsWithWindow(ids) {
            enlistPushIDsWithBrowser(ids);
            pushIdentifiers = concatenate(pushIdentifiers, ids);
        }
        function delistPushIDsWithWindow(ids) {
            delistPushIDsWithBrowser(ids);
            pushIdentifiers = complement(pushIdentifiers, ids);
        }
        function throwServerError(response) {
            throw 'Server internal error: ' + contentAsText(response);
        }
        function isJSONResponse(response) {
            var mimeType = getHeader(response, 'Content-Type');
            return mimeType && startsWith(mimeType, 'application/json');
        }
        function JSONRequest(request) {
            setHeader(request, 'Content-Type', 'application/json');
        }
        function browserID() {
            try {
                return lookupCookieValue(BrowserIDName);
            } catch (e) {
                return null;
            }
        }
        var commandDispatcher = CommandDispatcher();
        register(commandDispatcher, 'error', CommandError);
        namespace.updateToken = function(accessToken) {
            if (accessToken) {
                namespace.access_token = accessToken;
            }
        };
        window.addEventListener('voyent-access-token-refreshed',function(e) {
            namespace.updateToken(e.detail);
        });
        namespace.setupPush = function(configuration, onStartup, onShutdown) {
            namespace.updateToken(configuration.access_token);
            var apiChannel = Client(true);
            var API = {
                register: function (pushIds, callback) {
                    if ((typeof callback) == 'function') {
                        enlistPushIDsWithWindow(pushIds);
                        namespace.onNotification(function (ids, payload) {
                            var currentNotifications = asArray(intersect(ids, pushIds));
                            if (notEmpty(currentNotifications)) {
                                try {
                                    callback(currentNotifications, payload);
                                } catch (e) {
                                    error(namespace.logger, 'error thrown by push notification callback', e);
                                }
                            }
                        });
                    } else {
                        throw 'the callback is not a function';
                    }
                },
                deregister: delistPushIDsWithWindow,
                createPushId: function createPushId(callback, pushIdTimeout, cloudPushIdTimeout, retries) {
                    var uri = configuration.uri + configuration.account + '/realms/' + configuration.realm + '/push-ids?access_token=' + encodeURIComponent(namespace.access_token);
                    retries = retries == null ? 3 : retries;
                    var parameters = {
                        'access_token': namespace.access_token,
                        'browser':  browserID(),
                        'op': 'create'
                    };
                    if (pushIdTimeout) {
                        parameters.push_id_timeout = pushIdTimeout
                    }
                    if (cloudPushIdTimeout) {
                        parameters.cloud_push_id_timeout = cloudPushIdTimeout
                    }
                    var body = JSON.stringify(parameters);
                    postAsynchronously(apiChannel, uri, body, JSONRequest, $witch(function (condition) {
                        condition(CREATED, function (response) {
                            if (isJSONResponse(response)) {
                                var content = contentAsText(response);
                                var result = JSON.parse(content);
                                callback(result.push_id);
                            } else {
                                if (retries && retries > 1) {
                                    error(namespace.logger, 'failed to set ice.push.browser cookie');
                                    return;
                                }
                                deserializeAndExecute(commandDispatcher, contentAsText(response));
                                retries = retries ? retries + 1 : 1;
                                createPushId(retries, callback);
                            }
                        });
                        condition(ServerInternalError, throwServerError);
                    }));
                },
                deletePushId: function (id, resultCallback) {
                    var uri = configuration.uri + configuration.account + '/realms/' + configuration.realm + '/push-ids/' + encodeURIComponent(id);
                    deleteAsynchronously(apiChannel, uri, function (query) {
                        addNameValue(query, "access_token", namespace.access_token);
                    }, JSONRequest, $witch(function (condition) {
                        condition(NOCONTENT, resultCallback || noop);
                        condition(ServerInternalError, throwServerError);
                    }));
                },
                getConfiguration: function (callback) {
                    var uri = configuration.uri + configuration.account + '/realms/' + configuration.realm + '/configuration';
                    getAsynchronously(apiChannel, uri, function (query) {
                        addNameValue(query, "access_token", namespace.access_token);
                        addNameValue(query, "op", "get");
                    }, JSONRequest, $witch(function (condition) {
                        condition(OK, function (response) {
                            try {
                                deserializeAndExecute(commandDispatcher, contentAsText(response));
                            } finally {
                                callback();
                            }
                        });
                        condition(ServerInternalError, throwServerError);
                    }));
                },
                notify: function (group, options) {
                    var uri = configuration.uri + configuration.account + '/realms/' + configuration.realm + '/groups/' + group + '?access_token=' + encodeURIComponent(namespace.access_token) + '&op=push';
                    var body = JSON.stringify({
                        'access_token': namespace.access_token,
                        'browser': browserID(),
                        'op': 'push',
                        'push_configuration': options
                    });
                    postAsynchronously(apiChannel, uri, body, JSONRequest, $witch(function (condition) {
                        condition(ServerInternalError, throwServerError);
                    }));
                },
                addGroupMember: function (group, id, cloudEnabled, resultCallback) {
                    var uri = configuration.uri + configuration.account + '/realms/' + configuration.realm + '/groups/' + group + '/push-ids/' + id + '?access_token=' + encodeURIComponent(namespace.access_token) + '&op=add';
                    var parameters = {
                        'access_token': namespace.access_token,
                        'browser': browserID(),
                        'op': 'add'
                    };
                    if (cloudEnabled) {
                        parameters.push_configuration = {
                            'cloud_notification_enabled': true
                        }
                    }
                    var body = JSON.stringify(parameters);
                    postAsynchronously(apiChannel, uri, body, JSONRequest, $witch(function (condition) {
                        condition(NOCONTENT, resultCallback || noop);
                        condition(ServerInternalError, throwServerError);
                    }));
                },
                removeGroupMember: function (group, id, resultCallback) {
                    var uri = configuration.uri + configuration.account + '/realms/' + configuration.realm + '/groups/' + group + '/push-ids/' + id;
                    deleteAsynchronously(apiChannel, uri, function (query) {
                        addNameValue(query, "access_token", namespace.access_token);
                        addNameValue(query, "op", "delete");
                    }, JSONRequest, $witch(function (condition) {
                        condition(NOCONTENT, resultCallback || noop);
                        condition(ServerInternalError, throwServerError);
                    }));
                },
                addNotifyBackURI: function (notifyBackURI, resultCallback) {
                    var uri = configuration.uri + configuration.account + '/realms/' + configuration.realm + '/browsers/' + browserID() + '/notify-back-uris/' + notifyBackURI + '?access_token=' + encodeURIComponent(namespace.access_token) + '&op=add';
                    var body = JSON.stringify({
                        'access_token': namespace.access_token,
                        'browser': browserID(),
                        'op': 'add'
                    });
                    postAsynchronously(apiChannel, uri, body, JSONRequest, $witch(function (condition) {
                        condition(NOCONTENT, resultCallback || noop);
                        condition(ServerInternalError, throwServerError);
                    }));
                },
                removeNotifyBackURI: function (resultCallback) {
                    var uri = configuration.uri + configuration.account + '/realms/' + configuration.realm + '/browsers/' + browserID() + '/notify-back-uris';
                    deleteAsynchronously(apiChannel, uri, function (query) {
                        addNameValue(query, "access_token", namespace.access_token);
                        addNameValue(query, "op", "remove");
                    }, JSONRequest, $witch(function (condition) {
                        condition(NOCONTENT, resultCallback || noop);
                        condition(ServerInternalError, throwServerError);
                    }));
                },
                hasNotifyBackURI: function (resultCallback) {
                    var uri = configuration.uri + configuration.account + '/realms/' + configuration.realm + '/browsers/' + browserID() + '/notify-back-uris';
                    getAsynchronously(apiChannel, uri, function (query) {
                        addNameValue(query, "access_token", namespace.access_token);
                        addNameValue(query, "op", "has");
                    }, JSONRequest, $witch(function (condition) {
                        condition(NOCONTENT, function (response) {
                            resultCallback(true);
                        });
                        condition(NOTFOUND, function (response) {
                            resultCallback(false);
                        });
                        condition(ServerInternalError, throwServerError);
                    }));
                }
            };
            Bridge(configuration, API, onStartup, onShutdown);
            onKeyPress(document, function(ev) {
                var e = $event(ev);
                if (isEscKey(e)) cancelDefaultAction(e);
            });
            return API;
        };
        function Bridge(configuration, pushAPI, onStartup, onShutdown) {
            var windowID = namespace.windowID;
            var logger = childLogger(namespace.logger, windowID);
            var pushIdExpiryMonitor = PushIDExpiryMonitor(logger);
            var asyncConnection = AsyncConnection(logger, windowID, configuration);
            pushAPI.connection = {
                pauseConnection: function() {
                    pauseConnection(asyncConnection);
                },
                resumeConnection: function() {
                    resumeConnection(asyncConnection);
                }
            };
            function purgeNonRegisteredPushIDs(ids) {
                var registeredIDs = split(getValue(pushIDsSlot), ' ');
                return intersect(ids, registeredIDs);
            }
            function selectWindowNotifications(ids, payload) {
                try {
                    var windowPushIDs = asArray(intersect(ids, pushIdentifiers));
                    if (notEmpty(windowPushIDs)) {
                        broadcast(notificationListeners, [ windowPushIDs, payload ]);
                        if (payload) {
                            debug(logger, "picked up notifications with payload '" + payload + "' for this window: " + windowPushIDs);
                        } else {
                            debug(logger, "picked up notifications for this window: " + windowPushIDs);
                        }
                        return windowPushIDs;
                    } else {
                        return [];
                    }
                } catch (e) {
                    warn(logger, 'failed to listen for updates', e);
                    return [];
                }
            }
            var notificationBroadcaster = useLocalStorage() ?
                LocalStorageNotificationBroadcaster(NotifiedPushIDs, selectWindowNotifications) : CookieBasedNotificationBroadcaster(NotifiedPushIDs, selectWindowNotifications);
            register(commandDispatcher, 'notifications', function(notifications) {
                each(notifications, function(notification) {
                    var ids = notification['push-ids'];
                    notifyWindows(notificationBroadcaster, purgeNonRegisteredPushIDs(asSet(ids)), notification['payload']);
                });
            });
            register(commandDispatcher, 'noop', function() {
                debug(logger, 'received noop');
            });
            register(commandDispatcher, 'configuration', function(configuration) {
                debug(logger, 'received configuration');
                reconfigure(asyncConnection, configuration);
            });
            register(commandDispatcher, 'browser', function(browserID) {
                debug(logger, 'received browser ID');
                Cookie(BrowserIDName, browserID);
            });
            register(commandDispatcher, 'back-off', function(delay) {
                debug(logger, 'received back-off');
                try {
                    pauseConnection(asyncConnection);
                } finally {
                    runOnce(Delay(function() {
                        resumeConnection(asyncConnection);
                    }, delay));
                }
            });
            function dispose() {
                try {
                    info(logger, 'shutting down bridge...');
                    dispose = noop;
                    disposeBroadcast(notificationBroadcaster);
                } finally {
                    shutdown(asyncConnection);
                    if (onShutdown) {
                        onShutdown();
                    }
                }
            }
            onBeforeUnload(window, function() {
                pauseConnection(asyncConnection);
            });
            onUnload(window, dispose);
            onSend(asyncConnection, function(query) {
                if (heartbeatTimestamp) {
                    parameter(query, HeartbeatTimestamp, heartbeatTimestamp);
                }
            });
            onReceive(asyncConnection, function(response) {
                if (isJSONResponse(response)) {
                    var content = contentAsText(response);
                    deserializeAndExecute(commandDispatcher, content);
                    broadcast(receiveListeners, [ content ]);
                } else {
                    var mimeType = getHeader(response, 'Content-Type');
                    warn(logger, 'unknown content in response - ' + mimeType + ', expected text/xml');
                    dispose();
                }
            });
            onServerError(asyncConnection, function(response) {
                try {
                    warn(logger, 'server side error');
                    broadcast(serverErrorListeners, [ statusCode(response), contentAsText(response)]);
                } finally {
                    dispose();
                }
            });
            whenStopped(asyncConnection, function(reason) {
                debug(logger, reason + ' in window [' + windowID + ']');
                stopPushIDExpiry(pushIdExpiryMonitor);
            });
            whenReEstablished(asyncConnection, function(windowID) {
                broadcast(blockingConnectionReEstablishedListeners);
                (windowID == namespace.windowID ? resumePushIDExpiry : stopPushIDExpiry)(pushIdExpiryMonitor);
            });
            whenDown(asyncConnection, function(reconnectAttempts) {
                try {
                    warn(logger, 'connection to server was lost');
                    broadcast(blockingConnectionLostListeners, [ reconnectAttempts ]);
                } finally {
                    dispose();
                }
            });
            whenTrouble(asyncConnection, function() {
                warn(logger, 'connection in trouble');
                broadcast(blockingConnectionUnstableListeners);
            });
            info(logger, 'bridge loaded!');
            function finishStartup() {
                startConnection(asyncConnection);
                if (onStartup) {
                    onStartup();
                }
            }
            if (configuration.configuration && existsCookie(BrowserIDName)) {
                finishStartup();
            } else {
                pushAPI.getConfiguration(finishStartup);
            }
        }
    })(window.ice);
}
