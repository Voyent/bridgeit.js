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
| username | User name | String | | true |
| password | User password | String | | true |
| host | The BridgeIt Services host url | String | api.bridgeit.io | false |
| ssl | Whether to use SSL for network traffic | Boolean | false | false |
| expression | The expression for the metrics query TODO document expression format | String |  | false |

#### Return value

Promise with the query results.

#### Example

```javascript
bridgeit.services.auth.login({
	account: accountId,
	username: adminId,
	password: adminPassword,
	host: host
}).then(function(){
	return bridgeit.services.metrics.findMetrics({
		account: accountId,
		realm: realmId,
		host: host
	})
}).then(function(results){
	console.log('found ' + results.length + ' metrics');
	done();
}).catch(function(error){
	console.log('findMetrics failed ' + error);
});
```