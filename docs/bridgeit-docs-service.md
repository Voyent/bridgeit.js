#BridgeIt Documents Service JavaScript API

## Documents API

### createDocument

```javascript
function bridgeit.services.documents.createDocument(params)
```

Create a new JSON document.

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

Promise with the resource URI:

