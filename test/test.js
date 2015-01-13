describe('bridgeit.js tests', function () {

    describe('auth tests', function () {

        function validateAuthResponse(response){
            return response.access_token && response.expires_in;
        }

        it('logs in an admin', function (done) {

            var accountId = 'demox_corporate';
            var userId = 'bobwilliams';
            var password = 'secretest';

            bridgeit.services.auth.login({
                account: accountId,
                username: userId,
                password: password
            }).then(function(response){
                console.log(JSON.stringify(response));
                if( validateAuthResponse(response) )
                    done();
            }).catch(function(error){
                console.log('login failed ' + error);
            });

        });

        it('fails to login in as admin', function (done) {

            var accountId = 'ICEsoft Technologies Inc.';
            var userId = 'gregdick';
            var password = 'wrong';

            bridgeit.services.auth.login({
                account: accountId,
                username: userId,
                password: password
            }).then(function(response){
                console.log(JSON.stringify(response));
            }).catch(function(error){
                console.log('login failed ' + error);
                done();
            });

        });

        it('logs in a user', function (done) {

            var accountId = 'Bridget U';
            var realmId = 'bridgeit.u';
            var userId = 'student1';
            var password = 'student1';

            bridgeit.services.auth.login({
                account: accountId,
                realm: realmId,
                username: userId,
                password: password
            }).then(function(response){
                console.log(JSON.stringify(response));
                if( validateAuthResponse(response) )
                    done();
            }).catch(function(error){
                console.log('login failed ' + error);
            });

        });

        it('fails missing account', function (done) {

            var accountId = 'Bridget U';
            var realmId = 'bridgeit.u';
            var userId = 'student1';
            var password = 'student1';

            bridgeit.services.auth.login({
                realm: realmId,
                username: userId,
                password: password
            }).then(function(response){
                console.log(JSON.stringify(response));
            }).catch(function(error){
                console.log('login failed ' + error);
                done();
            });

        });

        it('fails missing username', function (done) {

            var accountId = 'Bridget U';
            var realmId = 'bridgeit.u';
            var userId = 'student1';
            var password = 'student1';

            bridgeit.services.auth.login({
                realm: realmId,
                account: accountId,
                password: password
            }).then(function(response){
                console.log(JSON.stringify(response));
            }).catch(function(error){
                console.log('login failed ' + error);
                done();
            });

        });

        it('fails missing password', function (done) {

            var accountId = 'Bridget U';
            var realmId = 'bridgeit.u';
            var userId = 'student1';
            var password = 'student1';

            bridgeit.services.auth.login({
                realm: realmId,
                account: accountId,
                username: userId
            }).then(function(response){
                console.log(JSON.stringify(response));
            }).catch(function(error){
                console.log('login failed ' + error);
                done();
            });

        });

        it('logs in with SSL', function (done) {

            var accountId = 'Bridget U';
            var realmId = 'bridgeit.u';
            var userId = 'student1';
            var password = 'student1';

            bridgeit.services.auth.login({
                account: accountId,
                realm: realmId,
                username: userId,
                password: password,
                ssl: true
            }).then(function(response){
                console.log(JSON.stringify(response));
                if( validateAuthResponse(response) )
                    done();
            }).catch(function(error){
                console.log('login failed ' + error);
            });

        });
    });


});