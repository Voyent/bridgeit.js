#BridgeIt Services JavaScript API

## Auth API

### login

```javascript
function bridgeit.services.auth.login(params)
```

Login into bridgeit services. 

This function will login into the BridgeIt auth service and return a user token and expiry timestamp upon 
successful authentication. This function does not need to be called if bridgeit.connect has already been
called, as that function will automatically extend the user session, unless the timeout has passed. 

The function returns a Promise that, when successful, returns an object with the following structure:
   {
      "access_token": "d9f7463d-d100-42b6-aecd-ae21e38e5d02",
      "expires_in": 1420574793844
   }

Which contains the access token and the time, in milliseconds that the session will expire in.

#### Parameters

| Name | Description | Type | Default | Required |
| ---- | ----------- | ---- | ------- | -------- |
| account | BridgeIt Services account name | String | | true |
| realm | BridgeIt Services realm (required only for non-admin logins) | String | | false |
| username | User name | String | | true |
| password | User password | String | | true |
| host | The BridgeIt Services host url | String | api.bridgeit.io | false |
| ssl | Whether to use SSL for network traffic | Boolean | false | false |

#### Return value

Promise with the following argument:

```javascript
     {
         access_token: 'd9f7463d-d100-42b6-aecd-ae21e38e5d02',
         expires_in: 1420574793844
     }
```