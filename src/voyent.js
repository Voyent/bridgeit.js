import { isNode } from './private-utils'

export let baseURL, authURL, authAdminURL, locateURL, docsURL, storageURL, eventURL,
           queryURL, actionURL, eventhubURL, mailboxURL, deviceURL, scopeURL,
           pushURL, cloudURL, metricsURL, activityURL, sysAdminURL, broadcastURL;

export const configureHosts = function (url) {
    if (url) {
        baseURL = url;
    }
    else {
        if (isNode()) {
            baseURL = 'http://dev.voyent.cloud';
        }
        else {
            baseURL = window.location.protocol + '//' + window.location.hostname;
            if (window.location.port) {
                baseURL += ':' + window.location.port
            }
        }
    }
    //remove any trailing '/'
    if (baseURL.substr(baseURL.length - 1) === '/') {
        baseURL = baseURL.slice(0, -1);
    }

    authURL = baseURL + '/auth';
    authAdminURL = baseURL + '/authadmin';
    locateURL = baseURL + '/locate';
    docsURL = baseURL + '/docs';
    storageURL = baseURL + '/storage';
    eventURL = baseURL + '/event';
    queryURL = baseURL + '/query';
    actionURL = baseURL + '/action';
    eventhubURL = baseURL + '/eventhub';
    mailboxURL = baseURL + '/mailbox';
    deviceURL = baseURL + '/device';
    scopeURL = baseURL + '/scope';
    pushURL = baseURL + '/notify';
    cloudURL = baseURL + '/cloud';
    activityURL = baseURL + '/activity';
    sysAdminURL = baseURL + '/administration';
    broadcastURL = baseURL + '/broadcast';
};

configureHosts();