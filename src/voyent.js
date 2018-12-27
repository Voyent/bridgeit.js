import { isNode } from 'private-utils'

export var baseURL;
if (isNode) {
    baseURL = 'http://dev.voyent.cloud';
} else {
    baseURL = window.location.protocol + '//' + window.location.hostname;
    if (window.location.port) {
        baseURL += ':' + window.location.port
    }
}

//remove any trailing '/'
if (baseURL.substr(baseURL.length - 1) === '/') {
    baseURL = baseURL.slice(0, -1);
}

export const authURL = baseURL + '/auth';
export const authAdminURL = baseURL + '/authadmin';
export const locateURL = baseURL + '/locate';
export const docsURL = baseURL + '/docs';
export const storageURL = baseURL + '/storage';
export const eventURL = baseURL + '/event';
export const queryURL = baseURL + '/query';
export const actionURL = baseURL + '/action';
export const eventhubURL = baseURL + '/eventhub';
export const mailboxURL = baseURL + '/mailbox';
export const deviceURL = baseURL + '/device';
export const scopeURL = baseURL + '/scope';
export const pushURL = baseURL + '/notify';
export const cloudURL = baseURL + '/cloud';
export const metricsURL = baseURL + '/metrics';
