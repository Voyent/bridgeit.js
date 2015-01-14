#BridgeIt Code Service JavaScript API

## Code API

### executeFlow

```javascript
function bridgeit.services.code.executeFlow(params)
```

Executes a code flow in the BridgeIt Code service.

#### Parameters

| Name | Description | Type | Default | Required |
| ---- | ----------- | ---- | ------- | -------- |
| account | BridgeIt Services account name | String | | true |
| realm | BridgeIt Services realm (required only for non-admin logins) | String | | false |
| username | User name | String | | true |
| password | User password | String | | true |
| host | The BridgeIt Services host url | String | api.bridgeit.io | false |
| ssl | Whether to use SSL for network traffic | Boolean | false | false |
| flow | The code flow name | String |  | true |
| data | Data to be passed to the code flow | Object |  | false |
| httpMethod | 'get' or 'post' | String | 'post' | false |

#### Return value

Promise with no arguments.

#### Example

```javascript
bridgeit.services.auth.login({
	account: accountId,
	username: adminId,
	password: adminPassword,
	host: host
}).then(function(){
	return bridgeit.services.code.executeFlow({
		account: accountId,
		realm: realmId,
		host: host,
		flow: 'udpateUserAndEmailManagers',
		httpMethod: 'post',
		data: {
			username: 'user1',
			email: 'email@biz.com'
		}
	})
}).then(function(){
	console.log('successfully launched code flow');
}).catch(function(error){
	console.log('something went wrong: ' + error);
});
```