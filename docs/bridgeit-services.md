#BridgeIt Services JavaScript API

## [Admin Service JavaScript API](bridgeit-admin-service.md)

## [Auth Service JavaScript API](bridgeit-auth-service.md)

## [Code Service JavaScript API](bridgeit-code-service.md)

## [Document Service JavaScript API](bridgeit-docs-service.md)

## [Location Service JavaScript API](bridgeit-location-service.md)

## [Metrics Service JavaScript API](bridgeit-metrics-service.md)

## ES6 Promise Support

The BridgeIt Services Client API is written with ECMAScript 6 Promise/A+ support. All API functions that use asynchronous network io will return a Promise. If your application already supports ES6 Promises, you can continue using those. ES6 Promises are supported in all modern browsers except IE11 (http://caniuse.com/#search=promise). To support older browsers, you can use a shim, such as `es6-promises`, like so:

```html
<script src="https://es6-promises.s3.amazonaws.com/es6-promise-2.0.1.js"></script>
<script>
    if( !("Promise" in window)){
        window.Promise = ES6Promise.Promise;
    }
</script>
<script src="bridgeit.js"></script>
<script src="bridgeit-services.js"></script>
```

## Tests

The BridgetIt JS API Mocha integration tests can be run from the test directory either through the `TestRunner.html` file or with PhantomJS.

```
mocha-phantomjs TestRunner.html
```

Mocha and PhantomJS are both required.

## Global bridgeit.services Functions

* [startTransaction](#startTransaction)
* [endTransation](#endTransation)
* [getLastTransactionId](#getLastTransactionId)

### <a name="startTransaction"></a>startTransaction

```javascript
function bridgeit.services.startTransaction()
```

Start a BridgeIt transaction.

This function will create a new transaction id, and automatially append the id to all bridgeit network calls. A BridgeIt transaction is not a ACID transaction, but simply a useful method to aid in 
auditing and diagnosing distributed network calls, especially among different services.

#### Example

```javascript
bridgeit.services.startTransaction();
console.log('started transaction: ' + bridgeit.services.getLastTransactionId());
bridgeit.services.auth.login({
	account: accountId,
	username: adminId,
	password: adminPassword,
	host: host
}).then(function(authResponse){
	return bridgeit.services.documents.createDocument({
		document: newDoc,
		realm: realmId
	});
}).then(function(docURI){
	newDocURI = docURI;
	var uriParts = docURI.split('/');
	var docId = uriParts[uriParts.length-1];
	return bridgeit.services.documents.deleteDocument({
		account: accountId,
		realm: realmId,
		host: host,
		id: docId
	})
}).then(function(){
	console.log('completed transaction: ' + bridgeit.services.getLastTransactionId());
	bridgeit.services.endTransation();
}).catch(function(error){
	console.log('something went wrong with transaction: ' + bridgeit.services.getLastTransactionId());
	bridgeit.services.endTransation();
});
});
```

### <a name="endTransation"></a>endTransation

```javascript
function bridgeit.services.endTransation()
```

End a BridgeIt transaction.

This function will remove the current BridgeIt transaction id, if one exists.

#### Example

See [startTransaction](#startTransaction).

### <a name="getLastTransactionId"></a>getLastTransactionId

```javascript
function bridgeit.services.getLastTransactionId()
```

Return the last stored BridgeIt tranaction id.

#### Example

See [startTransaction](#startTransaction).

