import * as utils from './private-utils'
import { locateURL, post, put, doDelete, getJSON, getResourcePermissions as getServiceResourcePermissions, updateResourcePermissions as updateServiceResourcePermissions} from './public-utils'
import { updateLastActiveTimestamp } from './auth-service'


function validateRequiredRegion(params, reject) {
    utils.validateParameter('region', 'The region parameter is required', params, reject);
}

function validateRequiredMonitor(params, reject) {
    utils.validateParameter('monitor', 'The monitor parameter is required', params, reject);
}

function validateRequiredPOI(params, reject) {
    utils.validateParameter('poi', 'The poi parameter is required', params, reject);
}

function validateRequiredLocation(params, reject) {
    utils.validateParameter('location', 'The location parameter is required', params, reject);
}

function validateRequiredLat(params, reject) {
    utils.validateParameter('lat', 'The lat parameter is required', params, reject);
}

function validateRequiredLon(params, reject) {
    utils.validateParameter('lon', 'The lon parameter is required', params, reject);
}

function validateRequiredAlert(params, reject) {
    utils.validateParameter('alert', 'The alert parameter is required', params, reject);
}

function validateRequiredCoordinates(params, reject) {
    utils.validateParameter('coordinates', 'The coordinates parameter is required', params, reject);
}

function validateRequiredAlertTemplate(params, reject) {
    utils.validateParameter('alertTemplate', 'The alertTemplate parameter is required', params, reject);
}

function validateRequiredAlertProperties(params, reject) {
    if (!params.location.location.properties || !params.location.location.properties.alertId) {
        reject(Error('The property alertId is required'));
    }
}

function validateRequiredState(params, reject) {
    utils.validateParameter('state', 'The state is required', params, reject);
}
    
/**
 * Create a new region.
 *
 * @memberOf voyent.locate
 * @alias createRegion
 * @param {Object} params params
 * @param {String} params.id The region id. If not provided, the service will return a new id
 * @param {Object} params.region The region geoJSON document that describes the region to be created
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 * @returns {String} The resource URI
 */
export function createRegion(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);
            validateRequiredRegion(params, reject);

            const url = utils.getRealmResourceURL(locateURL, account, realm,
                'regions/' + (params.id ? params.id : ''), token);

            post(url, params.region).then(function (response) {
                updateLastActiveTimestamp();
                resolve(response.uri);
            })['catch'](function (error) {
                reject(error);
            });
        }
    );
}

/**
 * Update a region.
 *
 * @memberOf voyent.locate
 * @alias updateRegion
 * @param {Object} params params
 * @param {String} params.id The region id, the region to be updated
 * @param {Object} params.region The new region
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 */
export function updateRegion(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);
            utils.validateRequiredId(params, reject);
            validateRequiredRegion(params, reject);

            const url = utils.getRealmResourceURL(locateURL, account, realm,
                'regions/' + params.id, token);

            put(url, params.region).then(function () {
                updateLastActiveTimestamp();
                resolve();
            })['catch'](function (error) {
                reject(error);
            });
        }
    );
}

/**
 * Delete a new region.
 *
 * @memberOf voyent.locate
 * @alias deleteRegion
 * @param {Object} params params
 * @param {String} params.id The region id.
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 */
export function deleteRegion(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);
            utils.validateRequiredId(params, reject);

            const url = utils.getRealmResourceURL(locateURL, account, realm,
                'regions/' + params.id, token);

            doDelete(url).then(function (response) {
                updateLastActiveTimestamp();
                resolve();
            })['catch'](function (error) {
                reject(error);
            });
        }
    );
}

/**
 * Fetches all saved regions for the realm.
 *
 * @memberOf voyent.locate
 * @alias getAllRegions
 * @param {Object} params params
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 * @returns {Object} The results
 */
export function getAllRegions(params) {
    return new Promise(
        function (resolve, reject) {

            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);

            const url = utils.getRealmResourceURL(locateURL, account, realm,
                'regions', token);

            getJSON(url).then(function (response) {
                updateLastActiveTimestamp();
                resolve(response);
            })['catch'](function (error) {
                reject(error);
            });
        }
    );
}

/**
 * Searches for regions in a realm based on a query.
 *
 * @memberOf voyent.locate
 * @alias findRegions
 * @param {Object} params params
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 * @param {Object} params.query A mongo query for the regions
 * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set
 * @param {Object} params.options Additional query options such as limit and sort
 * @returns {Object} The results
 */
export function findRegions(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            // Set 'nostore' to ensure the following checks don't update our lastKnown calls
            params.nostore = true;

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);

            const url = utils.getRealmResourceURL(locateURL, account, realm,
                'regions', token, {
                    'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                    'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                    'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                });

            getJSON(url).then(function (response) {
                updateLastActiveTimestamp();
                resolve(response);
            })['catch'](function (error) {
                if (error.status === 404) {
                    resolve();
                }
                else {
                    reject(error);
                }
            });
        }
    );
}

/**
 * Create a new location point of interest.
 *
 * @memberOf voyent.locate
 * @alias createPOI
 * @param {Object} params params
 * @param {String} params.id The POI id. If not provided, the service will return a new id
 * @param {Object} params.poi The POI document that describes the POI to be created
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 * @returns {String} The resource URI
 */
export function createPOI(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);
            validateRequiredPOI(params, reject);

            const url = utils.getRealmResourceURL(locateURL, account, realm,
                'poi' + (params.id ? '/' + params.id : ''), token);

            post(url, params.poi).then(function (response) {
                updateLastActiveTimestamp();
                resolve(response.uri);
            })['catch'](function (error) {
                reject(error);
            });
        }
    );
}

/**
 * Update a poi.
 *
 * @memberOf voyent.locate
 * @alias updatePOI
 * @param {Object} params params
 * @param {String} params.id The poi id, the poi to be updated
 * @param {Object} params.poi The new poi
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 */
export function updatePOI(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);
            utils.validateRequiredId(params, reject);
            validateRequiredPOI(params, reject);

            const url = utils.getRealmResourceURL(locateURL, account, realm,
                'poi/' + params.id, token);

            put(url, params.poi).then(function () {
                updateLastActiveTimestamp();
                resolve();
            })['catch'](function (error) {
                reject(error);
            });
        }
    );
}

/**
 * Searches for POIs in a realm based on a query.
 *
 * @memberOf voyent.locate
 * @alias findPOIs
 * @param {Object} params params
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 * @param {Object} params.query A mongo query for the points of interest
 * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set
 * @param {Object} params.options Additional query options such as limit and sort
 * @returns {Object} The results
 */
export function findPOIs(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);

            const url = utils.getRealmResourceURL(locateURL, account, realm,
                'poi', token, {
                    'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                    'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                    'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                });

            getJSON(url).then(function (response) {
                updateLastActiveTimestamp();
                resolve(response);
            })['catch'](function (error) {
                if (error.status === 404) {
                    resolve();
                }
                else {
                    reject(error);
                }
            });
        }
    );
}

/**
 * Delete a new POI.
 *
 * @memberOf voyent.locate
 * @alias deletePOI
 * @param {Object} params params
 * @param {String} params.id The POI id.
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 */
export function deletePOI(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);
            utils.validateRequiredId(params, reject);

            const url = utils.getRealmResourceURL(locateURL, account, realm,
                'poi/' + params.id, token);

            doDelete(url).then(function (response) {
                updateLastActiveTimestamp();
                resolve();
            })['catch'](function (error) {
                reject(error);
            });
        }
    );
}

/**
 * Fetches all saved POIs for the realm.
 *
 * @memberOf voyent.locate
 * @alias getAllPOIs
 * @param {Object} params params
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 * @returns {Object} The results
 */
export function getAllPOIs(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);

            const url = utils.getRealmResourceURL(locateURL, account, realm,
                'poi', token);

            getJSON(url).then(function (response) {
                updateLastActiveTimestamp();
                resolve(response);
            })['catch'](function (error) {
                reject(error);
            });
        }
    );
}

/**
 * Searches for locations in a realm based on a query.
 *
 * @memberOf voyent.locate
 * @alias findLocations
 * @param {Object} params params
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 * @param {Object} params.query A mongo query for the locations
 * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set
 * @param {Object} params.options Additional query options such as limit and sort
 * @returns {Object} The results
 */
export function findLocations(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);

            const url = utils.getRealmResourceURL(locateURL, account, realm,
                'locations', token, {
                    'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                    'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                    'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                });

            getJSON(url).then(function (response) {
                updateLastActiveTimestamp();
                resolve(response);
            })['catch'](function (error) {
                if (error.status === 404) {
                    resolve();
                }
                else {
                    reject(error);
                }
            });
        }
    );
}

/**
 * Update the location of the current user.
 *
 * @memberOf voyent.locate
 * @alias updateLocation
 * @param {Object} params params
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 * @param {Object} params.location The location
 */
export function updateLocation(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);
            validateRequiredLocation(params, reject);

            const url = utils.getRealmResourceURL(locateURL, account, realm,
                'locations', token);

            post(url, params.location).then(function (response) {
                updateLastActiveTimestamp();
                resolve(response);
            })['catch'](function (error) {
                reject(error);
            });
        }
    );
}

/**
 * Set the current users location with a latitude and longitude.
 *
 * @memberOf voyent.locate
 * @alias updateLocationCoordinates
 * @param {Object} params params
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 * @param {Number} params.lat The location latitude
 * @param {Number} params.lon The location longitude
 * @param {String} params.label An optional label
 */
export function updateLocationCoordinates(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);
            validateRequiredLat(params, reject);
            validateRequiredLon(params, reject);

            const location = {
                location: {
                    geometry: {
                        type: 'Point',
                        coordinates: [params.lon, params.lat]
                    },
                    properties: {
                        timestamp: new Date().toISOString()
                    }
                }
            };

            if (params.label) {
                location.label = params.label;
            }

            const url = utils.getRealmResourceURL(locateURL, account, realm,
                'locations', token);

            post(url, location).then(function (response) {
                updateLastActiveTimestamp();
                resolve(response);
            })['catch'](function (error) {
                reject(error);
            });
        }
    );
}

/**
 * Get the last known user location from the location service.
 *
 * @memberOf voyent.locate
 * @alias getLastUserLocation
 * @param {Object} params params
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 * @param {String} params.username
 * @returns {Object} The single result, if any, of the user location.
 http://dev.voyent.cloud/locate/bsrtests/realms/test/locations
 ?access_token=4be2fc2f-a53b-4987-9446-88d519faaa77
 &query={%22username%22:%22user%22}
 &options={%22sort%22:[[%22lastUpdated%22,%22desc%22]]}
 &results=one
 var locationURL = apiURL + '/locations' +
 '?access_token=' + encodeURIComponent(bsr.auth.getCurrentToken()) +
 '&query={"username": "' + encodeURIComponent(user) + '"} +' +
 '&options={"sort":[["lastUpdated","desc"]]}' +
 '&results=one';
 */

export function getLastUserLocation(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);
            utils.validateRequiredUsername(params, reject);

            const url = utils.getRealmResourceURL(locateURL, account, realm,
                'locations/', token, {
                    "query": {"username": params.username},
                    "options": {"sort": {"lastUpdated": -1}, "limit": 1}
                });

            getJSON(url).then(function (response) {
                updateLastActiveTimestamp();
                resolve(response[0] || null);
            })['catch'](function (response) {
                if (response.status === 403) {
                    resolve(null);
                }
                else {
                    reject(response);
                }
            });
        }
    );
}

/**
 * Delete a location.
 *
 * @memberOf voyent.locate
 * @alias deleteLocation
 * @param {Object} params params
 * @param {String} params.id The location id.
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 */
export function deleteLocation(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);
            utils.validateRequiredId(params, reject);

            const url = utils.getRealmResourceURL(locateURL, account, realm,
                'locations/' + params.id, token);

            doDelete(url).then(function (response) {
                updateLastActiveTimestamp();
                resolve();
            })['catch'](function (error) {
                reject(error);
            });
        }
    );
}

/**
 * Delete locations based on a query.
 *
 * @memberOf voyent.locate
 * @alias deleteLocations
 * @param {Object} params params
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 * @param {Object} params.query A mongo query for the locations.
 * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set.
 * @param {Object} params.options Additional query options such as limit and sort.
 */
export function deleteLocations(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);

            const url = utils.getRealmResourceURL(locateURL, account, realm,
                'locations/', token, {
                    'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                    'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                    'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                });

            doDelete(url).then(function () {
                updateLastActiveTimestamp();
                resolve();
            })['catch'](function (error) {
                reject(error);
            });
        }
    );
}

/**
 * Create a new alert template.
 *
 * @memberOf voyent.location
 * @alias createAlertTemplate
 * @param {Object} params params
 * @param {String} params.id The alert template id. If not provided, the service will return a new id.
 * @param {Object} params.alertTemplate The alert template GeoJSON document.
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 * @returns {String} The resource URI
 */
export function createAlertTemplate(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);
            validateRequiredAlertTemplate(params, reject);

            const url = utils.getRealmResourceURL(locateURL, account, realm,
                'alerts/' + (params.id ? encodeURIComponent(params.id) : ''), token);

            post(url, params.alertTemplate).then(function (response) {
                updateLastActiveTimestamp();
                resolve(response.uri);
            })['catch'](function (error) {
                reject(error);
            });
        }
    );
}

/**
 * Update an alert template.
 *
 * @memberOf voyent.location
 * @alias updateAlertTemplate
 * @param {Object} params params
 * @param {String} params.id The alert template id, the alert template to be updated.
 * @param {Object} params.alertTemplate The new alert template GeoJSON document.
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 */
export function updateAlertTemplate(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);
            utils.validateRequiredId(params, reject);
            validateRequiredAlertTemplate(params, reject);

            const url = utils.getRealmResourceURL(locateURL, account, realm,
                'alerts/' + encodeURIComponent(params.id), token);

            put(url, params.alertTemplate).then(function () {
                updateLastActiveTimestamp();
                resolve();
            })['catch'](function (error) {
                reject(error);
            });
        }
    );
}

/**
 * Delete an alert template.
 *
 * @memberOf voyent.location
 * @alias deleteAlertTemplate
 * @param {Object} params params
 * @param {String} params.id The id of alert template to be deleted.
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 */
export function deleteAlertTemplate(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);
            utils.validateRequiredId(params, reject);

            const url = utils.getRealmResourceURL(locateURL, account, realm,
                'alerts/' + encodeURIComponent(params.id), token);

            doDelete(url).then(function () {
                updateLastActiveTimestamp();
                resolve();
            })['catch'](function (error) {
                reject(error);
            });
        }
    );
}

/**
 * Search for alert templates based on a query.
 *
 * @memberOf voyent.location
 * @alias findAlertTemplates
 * @param {Object} params params
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 * @param {Object} params.query A mongo query for the alert templates.
 * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set
 * @param {Object} params.options Additional query options such as limit and sort
 * @returns {Object} The results
 */
export function findAlertTemplates(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            // Set 'nostore' to ensure the following checks don't update our lastKnown calls
            params.nostore = true;

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);

            const url = utils.getRealmResourceURL(locateURL, account, realm,
                'alerts', token, {
                    'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                    'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                    'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                });

            getJSON(url).then(function (response) {
                updateLastActiveTimestamp();
                resolve(response);
            })['catch'](function (error) {
                if (error.status === 404) {
                    resolve();
                }
                else {
                    reject(error);
                }
            });
        }
    );
}

/**
 * Create a new alert.
 *
 * @memberOf voyent.location
 * @alias createAlert
 * @param {Object} params params
 * @param {String} params.id The alert id. If not provided, the service will return a new id.
 * @param {Object} params.alert The alert GeoJSON document.
 * @param {Object} params.coordinates The alert coordinates in format [lng,lat].
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 * @returns {String} The resource URI
 */
export function createAlert(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);
            validateRequiredAlert(params, reject);
            validateRequiredCoordinates(params, reject);

            const url = utils.getRealmResourceURL(locateURL, account, realm,
                'alerts/' + (params.id ? encodeURIComponent(params.id) : ''), token);

            post(url,{"alert":params.alert,"coordinates":params.coordinates}).then(function (response) {
                updateLastActiveTimestamp();
                resolve(response.uri);
            })['catch'](function (error) {
                reject(error);
            });
        }
    );
}

/**
 * Update an alert template.
 *
 * @memberOf voyent.location
 * @alias updateAlertTemplate
 * @param {Object} params params
 * @param {String} params.id The alert id, the alert template to be updated.
 * @param {Object} params.alert The new alert GeoJSON document.
 * @param {Object} params.coordinates The new alert coordinates in format [lng,lat].
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 */
export function updateAlert(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);
            utils.validateRequiredId(params, reject);
            validateRequiredAlert(params, reject);
            validateRequiredCoordinates(params, reject);

            const url = utils.getRealmResourceURL(locateURL, account, realm,
                'alerts/' + encodeURIComponent(params.id), token);

            put(url,{"alert":params.alert,"coordinates":params.coordinates}).then(function () {
                updateLastActiveTimestamp();
                resolve();
            })['catch'](function (error) {
                reject(error);
            });
        }
    );
}

/**
 * Deletes an alert instance.
 *
 * @memberOf voyent.location
 * @alias deleteAlert
 * @param {Object} params params
 * @param {String} params.id The id of the alert template that the instance was created from.
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 */
export function deleteAlert(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);
            utils.validateRequiredId(params, reject);

            const url = utils.getRealmResourceURL(locateURL, account, realm,
                'alerts/instances/' + encodeURIComponent(params.id), token);

            doDelete(url).then(function () {
                updateLastActiveTimestamp();
                resolve();
            })['catch'](function (error) {
                reject(error);
            });
        }
    );
}

/**
 * Update the location of an alert.
 *
 * @memberOf voyent.locate
 * @alias updateAlertLocation
 * @param {Object} params params
 * @param {Object} params.location The location, must include the location.properties.alertId property.
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 */
export function updateAlertLocation(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);
            validateRequiredLocation(params, reject);
            validateRequiredAlertProperties(params, reject);
            params.location.location.type = "Feature"; //Always set the GeoJSON type.

            const url = utils.getRealmResourceURL(locateURL, account, realm,
                'locations', token);

            post(url, params.location).then(function (response) {
                updateLastActiveTimestamp();
                resolve(response);
            })['catch'](function (error) {
                reject(error);
            });
        }
    );
}

/**
 * Change the state of an alert.
 *
 * @memberOf voyent.locate
 * @alias updateAlertState
 * @param {Object} params params
 * @param {String} params.id The alert id, the alert whose state will be changed.
 * @param {Object} params.state The new alert state. One of draft, preview, active, deprecated, ended.
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 */
export function updateAlertState(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);
            utils.validateRequiredId(params, reject);
            validateRequiredState(params, reject);

            const url = utils.getRealmResourceURL(locateURL, account, realm,
                'alerts/' + encodeURIComponent(params.id) + '/state', token);

            put(url, {"state":params.state}).then(function () {
                updateLastActiveTimestamp();
                resolve();
            })['catch'](function (error) {
                reject(error);
            });
        }
    );
}

/**
 * @memberOf voyent.locate
 * @alias getAlertsList
 * @param {Object} params params
 * @param {Object} params.opts 
 */
export function getAlertsList(params) {
    return new Promise(function (resolve, reject) {
        params = params ? params : {};

        // Set 'nostore' to ensure the following checks don't update our lastKnown calls.
        params.nostore = true;

        // Get and validate the required parameters.
        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const realm = utils.validateAndReturnRequiredRealmName(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);
        const opts = params.opts && typeof params.opts === 'object'
            ? encodeURIComponent(JSON.stringify(params.opts))
            : '{}';

        // Build the URL.
        const url = utils.getRealmResourceURL(locateURL, account, realm,
            'alertsList', token, {
                opts: opts
            }
        );

        // Make the request.
        getJSON(url).then(function (json) {
            updateLastActiveTimestamp();
            resolve(json);
        })['catch'](function (error) {
            reject(error);
        });
    });
}

/**
 * @memberOf voyent.locate
 * @alias getTemplatesList
 * @param {Object} params params
 * @param {Object} params.opts 
 */
export function getTemplatesList(params) {
    return new Promise(function (resolve, reject) {
        params = params ? params : {};

        // Set 'nostore' to ensure the following checks don't update our lastKnown calls.
        params.nostore = true;

        // Get and validate the required parameters.
        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const realm = utils.validateAndReturnRequiredRealmName(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);
        const opts = params.opts && typeof params.opts === 'object'
            ? encodeURIComponent(JSON.stringify(params.opts))
            : '{}';

        // Build the URL.
        const url = utils.getRealmResourceURL(locateURL, account, realm,
            'templatesList', token, {
                opts: opts
            }
        );

        // Make the request.
        getJSON(url).then(function (json) {
            updateLastActiveTimestamp();
            resolve(json);
        })['catch'](function (error) {
            reject(error);
        });
    });
}

export function getRegionResourcePermissions(params) {
    params.path = 'regions';
    return getResourcePermissions(params);
}

export function updateRegionResourcePermissions(params) {
    params.path = 'regions';
    return updateResourcePermissions(params);
}

export function getPOIResourcePermissions(params) {
    params.path = 'poi';
    return getResourcePermissions(params);
}

export function updatePOIResourcePermissions(params) {
    params.path = 'poi';
    return updateResourcePermissions(params);
}

export function getAlertResourcePermissions(params) {
    params.path = 'alert';
    return getResourcePermissions(params);
}

export function updateAlertResourcePermissions(params) {
    params.path = 'alert';
    return updateResourcePermissions(params);
}

export function getResourcePermissions(params) {
    params.service = 'locate';
    return getServiceResourcePermissions(params);
}

export function updateResourcePermissions(params) {
    params.service = 'locate';
    return updateServiceResourcePermissions(params);
}

