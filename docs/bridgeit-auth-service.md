#BridgeIt Authentication Service JavaScript API

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

### connect
```javascript
function bridgeit.services.auth.connect(params)
```

Connect to bridgeit services. 

This function will connect to the BridgeIt services, and maintain the connection for the specified 
timeout period (default 20 minutes). By default, the BridgeIt push service is also activated, so the client
may send and receive push notifications after connecting.

After connecting to BridgeIt Services, any BridgeIt service API may be used without needing to re-authenticate.
After successfully connecting, an authentication token will be stored in session storage and available through 
`bridgeit.services.auth.getAccessToken()`. This authentication information will automatically be used by other BridgeIt API
calls, so the token does not be included in subsequent calls, but is available if desired.

A simple example of connecting to the BridgeIt Services and then making a service call is the following:

```javascript
bridgeit.connect({
          account: 'my_account', 
          realm: 'realmA', 
          user: 'user', 
          password: 'secret'})
  .then( function(){
      console.log("successfully connnected to BridgeIt Services");
      //now we can fetch some docs
      return bridgeit.docService.get('documents');
   })
   .then( function(docs){
      for( var d in docs ){ ... };
   })
   .catch( function(error){
      console.log("error connecting to BridgeIt Services: " + error);
   });
```

In order to automatically reconnect, the `storeCredentials` parameter must be set to true (default), otherwise user credentials will not be available and bridgeit will not be able to reconnect automatically. Credentials are stored in the browser sessionStorage in encoded form for both key and value. These credentials are not easily retrievable from the browser, and will be removed when the browser session expires, although it is possible that credentials, when stored, may be retrieved and decoded without permission. Thus it is recommended that this feature not be used when stricter security measures are required.
