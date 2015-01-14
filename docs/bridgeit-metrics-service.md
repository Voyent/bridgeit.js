#BridgeIt Metrics Service JavaScript API

## Metrics API

### findMetrics

```javascript
function bridgeit.services.metrics.findMetrics(params)
```

Searches for Metrics in a realm based on an expression

#### Parameters

| Name | Description | Type | Default | Required |
| ---- | ----------- | ---- | ------- | -------- |
| account | BridgeIt Services account name | String | | true |
| realm | BridgeIt Services realm (required only for non-admin logins) | String | | false |
| accessToken | The BridgeIt authentication token. If not provided, the stored token from bridgeit.services.auth.connect() will be used | String | | false |
| host | The BridgeIt Services host url. If not supplied, the last used BridgeIt host, or the default will be used. | String | api.bridgeit.io | false |
| ssl | Whether to use SSL for network traffic | Boolean | false | false |
| expression | The expression for the metrics query TODO document expression format | String |  | false |

#### Return value

Promise with the query results.

#### Example

```javascript
bridgeit.services.metrics.findMetrics({
		account: accountId,
		realm: realmId,
		accessToken: "d9f7463d-d100-42b6-aecd-ae21e38e5d02"
	})
}).then(function(results){
	console.log('found ' + results.length + ' metrics');
	done();
}).catch(function(error){
	console.log('findMetrics failed ' + error);
});
```