describe('bridgeit.js tests', function () {

	var accountId = 'demox_corporate';
	var realmId = 'nargles.net';
	var adminId = 'bobwilliams';
	var adminPassword = 'secretest';
	var userId = 'johnsmith';
	var userPassword = 'secretest';
	var host = 'localhost';

	describe('auth tests', function () {

		function validateAuthResponse(response){
			return response.access_token && response.expires_in;
		}

		describe('login function tests', function(){
			
			it('logs in an admin', function (done) {

				bridgeit.services.auth.login({
					account: accountId,
					username: adminId,
					password: adminPassword,
					host: host
				}).then(function(response){
					console.log(JSON.stringify(response));
					if( validateAuthResponse(response) )
						done();
				}).catch(function(error){
					console.log('login failed ' + error);
				});

			});

			it('fails to login in as admin', function (done) {

				bridgeit.services.auth.login({
					account: accountId,
					username: userId,
					password: userPassword,
					host: host
				}).then(function(response){
					console.log(JSON.stringify(response));
				}).catch(function(error){
					console.log('login failed ' + error);
					done();
				});

			});

			it('logs in a user', function (done) {

				bridgeit.services.auth.login({
					account: accountId,
					realm: realmId,
					username: userId,
					password: userPassword,
					host: host
				}).then(function(response){
					console.log(JSON.stringify(response));
					if( validateAuthResponse(response) )
						done();
				}).catch(function(error){
					console.log('login failed ' + error);
				});

			});

			it('fails missing account', function (done) {

				bridgeit.services.auth.login({
					realm: realmId,
					username: userId,
					password: userPassword,
					host: host
				}).then(function(response){
					console.log(JSON.stringify(response));
				}).catch(function(error){
					console.log('login failed ' + error);
					done();
				});

			});

			it('fails missing username', function (done) {

				bridgeit.services.auth.login({
					realm: realmId,
					account: accountId,
					password: userPassword,
					host: host
				}).then(function(response){
					console.log(JSON.stringify(response));
				}).catch(function(error){
					console.log('login failed ' + error);
					done();
				});

			});

			it('fails missing password', function (done) {

				bridgeit.services.auth.login({
					realm: realmId,
					account: accountId,
					username: userId,
					host: host
				}).then(function(response){
					console.log(JSON.stringify(response));
				}).catch(function(error){
					console.log('login failed ' + error);
					done();
				});

			});

			it('logs in with SSL', function (done) {

				bridgeit.services.auth.login({
					account: accountId,
					realm: realmId,
					username: userId,
					password: userPassword,
					ssl: true,
					host: host
				}).then(function(response){
					console.log(JSON.stringify(response));
					if( validateAuthResponse(response) )
						done();
				}).catch(function(error){
					console.log('login failed ' + error);
				});

			});
		});

		describe('connect function tests', function(){
			it('connects as an admin', function (done) {
				bridgeit.services.auth.connect({
					account: accountId,
					username: adminId,
					password: adminPassword,
					host: host
				}).then(function(response){
					console.log(JSON.stringify(response));
					if( validateAuthResponse(response) ){
						var access_token = bridgeit.services.auth.getAccessToken();
						var expires_in = bridgeit.services.auth.getExpiresIn();
						console.log('access_token: ' + access_token);
						if( access_token == response.access_token && expires_in == response.expires_in ){
							done();
						}
						else{
							console.log('could not retrieve access_token('+ access_token + ')(' + response.access_token + ') and expires_in(' + expires_in + ')(' + response.expires_in + ')');
						}
					}
					else{
						console.log('connect could not validate auth response');
					}
				}).catch(function(error){
					console.log('login failed ' + error);
				});
			});
		});
		
	});

	describe('document tests', function () {
		describe('createDocument function tests', function(){
			it('creates a new unnamed document', function (done) {

				var newDoc = {test: true};

				bridgeit.services.auth.login({
					account: accountId,
					username: adminId,
					password: adminPassword,
					host: host
				}).then(function(authResponse){
					return bridgeit.services.documents.createDocument({
						account: accountId,
						realm: realmId,
						host: host,
						document: newDoc
					});
				}).then(function(docURI){
					console.log('new doc URI: ' + docURI);
					done();
				}).catch(function(error){
					console.log('createDocument failed ' + error);
				});

			});
		});

		describe('deleteDocument function tests', function(){
			it('creates a new unnamed document and deletes it', function (done) {

				var newDoc = {test: true};
				
				bridgeit.services.auth.login({
					account: accountId,
					username: adminId,
					password: adminPassword,
					host: host
				}).then(function(authResponse){
					return bridgeit.services.documents.createDocument({
						account: accountId,
						realm: realmId,
						host: host,
						document: newDoc
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
					console.log('deleted doc');
					done();
				}).catch(function(error){
					console.log('deleteDocument failed ' + error);
				});

			});
		});

		describe('updateDocument function tests', function(){
			it('creates a new unnamed document and updates it', function (done) {

				var newDoc = {test: true};
				
				bridgeit.services.auth.login({
					account: accountId,
					username: adminId,
					password: adminPassword,
					host: host
				}).then(function(authResponse){
					return bridgeit.services.documents.createDocument({
						account: accountId,
						realm: realmId,
						host: host,
						document: newDoc
					});
				}).then(function(docURI){
					newDocURI = docURI;
					var uriParts = docURI.split('/');
					var docId = uriParts[uriParts.length-1];
					newDoc.test = false;
					return bridgeit.services.documents.updateDocument({
						account: accountId,
						realm: realmId,
						host: host,
						id: docId,
						document: newDoc
					})
				}).then(function(){
					console.log('updated doc');
					done();
				}).catch(function(error){
					console.log('delete failed ' + error);
				});

			});
		});

		describe('getDocument function tests', function(){
			it('creates a new unnamed document and fetches it', function (done) {

				var newDoc = {test: true};
				
				bridgeit.services.auth.login({
					account: accountId,
					username: adminId,
					password: adminPassword,
					host: host
				}).then(function(authResponse){
					return bridgeit.services.documents.createDocument({
						account: accountId,
						realm: realmId,
						host: host,
						document: newDoc
					});
				}).then(function(docURI){
					newDocURI = docURI;
					var uriParts = docURI.split('/');
					var docId = uriParts[uriParts.length-1];
					return bridgeit.services.documents.getDocument({
						account: accountId,
						realm: realmId,
						host: host,
						id: docId
					})
				}).then(function(doc){
					if( doc.test )
						done();
					else{
						console.log('did not receive expected doc: ' + JSON.stringify(doc));
					}
				}).catch(function(error){
					console.log('getDocument failed ' + error);
				});

			});
		});

		describe('findDocuments function tests', function(){
			it('creates a new unnamed document and searches for it', function (done) {

				var key = new Date().getTime();
				var newDoc = {key: key, value: true};
				
				bridgeit.services.auth.login({
					account: accountId,
					username: adminId,
					password: adminPassword,
					host: host
				}).then(function(authResponse){
					return bridgeit.services.documents.createDocument({
						account: accountId,
						realm: realmId,
						host: host,
						document: newDoc
					});
				}).then(function(docURI){
					newDocURI = docURI;
					var uriParts = docURI.split('/');
					var docId = uriParts[uriParts.length-1];
					return bridgeit.services.documents.findDocuments({
						account: accountId,
						realm: realmId,
						host: host,
						query: {key: key}
					})
				}).then(function(results){
					if( results && results.length === 1 && results[0].value )
						done();
					else{
						console.log('did not receive expected doc: ' + JSON.stringify(doc));
					}
				}).catch(function(error){
					console.log('findDocuments failed ' + error);
				});

			});
		});
	});

	describe('locate tests', function(){

		var newRegion = { 
					location: {
						properties: {
							country: 'Canada'
						}
					}
				};
		
		var validMonitorWithoutId = {
			label: 'Various Cities Monitor',
			active: true,
			elapsedTimeLimit: 5,
			locationChangeLimit: 100,
			locationNearLimit: 1000,
			regions: {
				ids: ['Victoria', 'Calgary', 'Paris']
			},
			poi: {
				ids: ['statueofliberty'],
				tags: ['monument']
			},
			events: ['bridgeit.locate.locationChanged', 'bridgeit.locate.enteredRegion', 'bridgeit.locate.exitedRegion'],
			destinations: [
				{
					url: 'http://dev.bridgeit.io/code/bridgeit.test/flows/customflowid',
					payload: {}
				},
				{
					url: 'push://bridgeit/studentPushGroup',
					payload: {}
				},
				{
					url: 'ws://joe:seakret@bridgeit/dummyEntry',
					payload: {}
				}
			]
		};

		var validPointOfInterestWithId = {
		    _id: 'statueofliberty',
		    label: 'Statue of Liberty',
		    location: {
		        type: 'Feature',
		        geometry: {
		            type: 'Point',
		            coordinates: [
		                -74.0445004,
		                40.6892494
		            ]
		        },
		        properties: {
		            tags: ['statue', 'USA', 'tourist', 'monument']
		        }
		    }
		};

		describe('createRegion function tests', function(){
			it('creates a new unnamed region and searches for it', function (done) {
				
				bridgeit.services.auth.login({
					account: accountId,
					username: adminId,
					password: adminPassword,
					host: host
				}).then(function(authResponse){
					return bridgeit.services.location.createRegion({
						account: accountId,
						realm: realmId,
						host: host,
						region: newRegion
					});
				}).then(function(uri){
					console.log('new region URI: ' + uri);
					done();
				}).catch(function(error){
					console.log('createRegion failed ' + error);
				});
			});
		});

		describe('deleteRegion function tests', function(){
			it('creates a new unnamed region and then deletes it', function (done) {
				bridgeit.services.auth.login({
					account: accountId,
					username: adminId,
					password: adminPassword,
					host: host
				}).then(function(authResponse){
					return bridgeit.services.location.createRegion({
						account: accountId,
						realm: realmId,
						host: host,
						region: newRegion
					});
				}).then(function(uri){
					console.log('new region URI: ' + uri);
					var uriParts = uri.split('/');
					var regionId = uriParts[uriParts.length-1];
					return bridgeit.services.location.deleteRegion({
						account: accountId,
						realm: realmId,
						host: host,
						id: regionId
					})
				}).then(function(){
					console.log('successfully deleted region');
					done();
				}).catch(function(error){
					console.log('deleteRegion failed ' + error);
				});
			});
		});

		describe('getAllRegions function tests', function(){
			it('creates a new unnamed region and then fetches it with getAllRegions', function (done) {
				bridgeit.services.auth.login({
					account: accountId,
					username: adminId,
					password: adminPassword,
					host: host
				}).then(function(authResponse){
					return bridgeit.services.location.createRegion({
						account: accountId,
						realm: realmId,
						host: host,
						region: newRegion
					});
				}).then(function(uri){
					console.log('new region URI: ' + uri);
					var uriParts = uri.split('/');
					var regionId = uriParts[uriParts.length-1];
					return bridgeit.services.location.getAllRegions({
						account: accountId,
						realm: realmId,
						host: host
					})
				}).then(function(results){
					console.log('found ' + results.length + ' regions');
					done();
				}).catch(function(error){
					console.log('getAllRegions failed ' + error);
				});
			});
		});

		describe('findRegions function tests', function(){
			it('creates a new unnamed region and then fetches it with findRegions', function (done) {
				
				bridgeit.services.auth.login({
					account: accountId,
					username: adminId,
					password: adminPassword,
					host: host
				}).then(function(authResponse){
					return bridgeit.services.location.createRegion({
						account: accountId,
						realm: realmId,
						host: host,
						region: newRegion
					});
				}).then(function(uri){
					console.log('new region URI: ' + uri);
					var uriParts = uri.split('/');
					var regionId = uriParts[uriParts.length-1];
					return bridgeit.services.location.findRegions({
						account: accountId,
						realm: realmId,
						host: host,
						query: newRegion
					})
				}).then(function(results){
					console.log('found ' + results.length + ' regions');
					done();
				}).catch(function(error){
					console.log('findRegions failed ' + error);
				});
			});
		});

		describe('createMonitor function tests', function(){
			it('creates a new unnamed monitor and then fetches it with findMonitors', function (done) {
				
				bridgeit.services.auth.login({
					account: accountId,
					username: adminId,
					password: adminPassword,
					host: host
				}).then(function(authResponse){
					return bridgeit.services.location.createMonitor({
						account: accountId,
						realm: realmId,
						host: host,
						monitor: validMonitorWithoutId
					});
				}).then(function(uri){
					console.log('new monitor URI: ' + uri);
					var uriParts = uri.split('/');
					var regionId = uriParts[uriParts.length-1];
					return bridgeit.services.location.findMonitors({
						account: accountId,
						realm: realmId,
						host: host,
						query: validMonitorWithoutId
					})
				}).then(function(results){
					console.log('found ' + results.length + ' monitors');
					done();
				}).catch(function(error){
					console.log('createMonitor failed ' + error);
				});
			});
		});

		describe('getAllMonitors function tests', function(){
			it('creates a new unnamed monitor and then fetches it with getAllMonitors', function (done) {
				bridgeit.services.auth.login({
					account: accountId,
					username: adminId,
					password: adminPassword,
					host: host
				}).then(function(authResponse){
					return bridgeit.services.location.createMonitor({
						account: accountId,
						realm: realmId,
						host: host,
						monitor: validMonitorWithoutId
					});
				}).then(function(uri){
					console.log('new monitor URI: ' + uri);
					var uriParts = uri.split('/');
					var regionId = uriParts[uriParts.length-1];
					return bridgeit.services.location.getAllMonitors({
						account: accountId,
						realm: realmId,
						host: host
					})
				}).then(function(results){
					console.log('found ' + results.length + ' monitors');
					done();
				}).catch(function(error){
					console.log('getAllMonitors failed ' + error);
				});
			});
		});

		describe('deleteMonitor function tests', function(){
			it('creates a new unnamed monitor and then deletes it', function (done) {
				bridgeit.services.auth.login({
					account: accountId,
					username: adminId,
					password: adminPassword,
					host: host
				}).then(function(authResponse){
					return bridgeit.services.location.createMonitor({
						account: accountId,
						realm: realmId,
						host: host,
						monitor: validMonitorWithoutId
					});
				}).then(function(uri){
					console.log('new monitor URI: ' + uri);
					var uriParts = uri.split('/');
					var monitorId = uriParts[uriParts.length-1];
					return bridgeit.services.location.deleteMonitor({
						account: accountId,
						realm: realmId,
						host: host,
						id: monitorId
					})
				}).then(function(){
					console.log('successfully deleted monitor');
					done();
				}).catch(function(error){
					console.log('deleteMonitor failed ' + error);
				});
			});
		});

		describe('createPOI function tests', function(){
			it('creates a new unnamed POI and then fetches it with findPOIs', function (done) {
				
				bridgeit.services.auth.login({
					account: accountId,
					username: adminId,
					password: adminPassword,
					host: host
				}).then(function(authResponse){
					return bridgeit.services.location.createPOI({
						account: accountId,
						realm: realmId,
						host: host,
						poi: validPointOfInterestWithId
					});
				}).then(function(uri){
					console.log('new monitor URI: ' + uri);
					var uriParts = uri.split('/');
					var regionId = uriParts[uriParts.length-1];
					return bridgeit.services.location.findPOIs({
						account: accountId,
						realm: realmId,
						host: host,
						query: validPointOfInterestWithId
					})
				}).then(function(results){
					console.log('found ' + results.length + ' POIs');
					done();
				}).catch(function(error){
					console.log('createPOI failed ' + error);
				});
			});
		});

		describe('deletePOI function tests', function(){
			it('creates a new unnamed POI and then deletes it', function (done) {
				bridgeit.services.auth.login({
					account: accountId,
					username: adminId,
					password: adminPassword,
					host: host
				}).then(function(authResponse){
					return bridgeit.services.location.createPOI({
						account: accountId,
						realm: realmId,
						host: host,
						poi: validPointOfInterestWithId
					});
				}).then(function(uri){
					console.log('new POI URI: ' + uri);
					var uriParts = uri.split('/');
					var poiId = uriParts[uriParts.length-1];
					return bridgeit.services.location.deletePOI({
						account: accountId,
						realm: realmId,
						host: host,
						id: poiId
					})
				}).then(function(){
					console.log('successfully deleted POI');
					done();
				}).catch(function(error){
					console.log('deletePOI failed ' + error);
				});
			});
		});

		describe('getAllPOIs function tests', function(){
			it('creates a new unnamed POI and then fetches it with getAllPOIs', function (done) {
				bridgeit.services.auth.login({
					account: accountId,
					username: adminId,
					password: adminPassword,
					host: host
				}).then(function(authResponse){
					return bridgeit.services.location.createPOI({
						account: accountId,
						realm: realmId,
						host: host,
						poi: validPointOfInterestWithId
					});
				}).then(function(uri){
					console.log('new monitor URI: ' + uri);
					var uriParts = uri.split('/');
					var regionId = uriParts[uriParts.length-1];
					return bridgeit.services.location.getAllPOIs({
						account: accountId,
						realm: realmId,
						host: host
					})
				}).then(function(results){
					console.log('found ' + results.length + ' POIs');
					done();
				}).catch(function(error){
					console.log('getAllPOIs failed ' + error);
				});
			});
		});


	});


});