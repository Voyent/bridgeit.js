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
                    console.log('create document failed ' + error);
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
                    console.log('delete document failed ' + error);
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
                    console.log('delete document failed ' + error);
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
                    console.log('getDocument document failed ' + error);
                });

            });
        });
    });


});