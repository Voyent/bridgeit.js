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
| accessToken | The BridgeIt authentication token. If not provided, the stored token from bridgeit.services.auth.connect() will be used | String | | false |
| host | The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. | String | api.bridgeit.io | false |
| ssl | Whether to use SSL for network traffic | Boolean | false | false |
| flow | The code flow name | String |  | true |
| data | Data to be passed to the code flow | Object |  | false |
| httpMethod | 'get' or 'post' | String | 'post' | false |

#### Return value

Promise with no arguments.

#### Example

```javascript
bridgeit.services.code.executeFlow({
		account: accountId,
		realm: realmId,
		accessToken: "d9f7463d-d100-42b6-aecd-ae21e38e5d02"
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