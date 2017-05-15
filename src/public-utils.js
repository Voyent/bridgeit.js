function PublicUtils(utils) {
    return {

        serializePostData: function(data){
            //TODO
        },

        get: function(url, headers){
            return new Promise(function(resolve, reject) {
                var request = new XMLHttpRequest();
                request.open('GET', url, true);
                if( headers ){
                    for( var header in headers ){
                        request.setRequestHeader(header, headers[header]);
                    }
                }
                request.onreadystatechange = function() {
                    if (this.readyState === 4) {
                        if (this.status >= 200 && this.status < 400) {
                            resolve(this.responseText);
                        } else {
                            reject(utils.extractResponseValues(this));
                        }
                    }
                };
                request.onabort = function(evt){
                    reject(evt);
                };
                request.onerror = function(err){
                    reject(err);
                };
                request.send();
                request = null;
            });
        },

        getJSON: function(url, headers){
            return new Promise(function(resolve, reject) {
                var request = new XMLHttpRequest();
                request.open('GET', url, true);
                if( headers ){
                    for( var header in headers ){
                        request.setRequestHeader(header, headers[header]);
                    }
                }
                request.onreadystatechange = function() {
                    if (this.readyState === 4) {
                        if (this.status >= 200 && this.status < 400) {
                            if (this.responseText) {
                                resolve(JSON.parse(this.responseText));
                            }
                            else {
                                resolve();
                            }
                        } else {
                            reject(utils.extractResponseValues(this));
                        }
                    }
                };
                request.onabort = function(evt){
                    reject(evt);
                };
                request.onerror = function(err){
                    reject(err);
                };
                request.send();
                request = null;
            });
        },

        getBlob: function(url, headers){
            return new Promise(function(resolve, reject){
                var request = new XMLHttpRequest();
                if( headers ){
                    for( var header in headers ){
                        request.setRequestHeader(header, headers[header]);
                    }
                }
                request.onreadystatechange = function(){
                    if (this.readyState === 4){
                        if( this.status === 200){
                            resolve(new Uint8Array(this.response));
                        }
                        else{
                            reject(this);
                        }
                    }
                };
                request.onabort = function(evt){
                    reject(evt);
                };
                request.onerror = function(err){
                    reject(err);
                };
                request.open('GET', url);
                request.responseType = 'arraybuffer';
                request.send();
                request = null;
            });
        },

        post: function(url, data, headers, isFormData, contentType, progressCallback, onabort, onerror){
            return new Promise(function(resolve, reject) {
                console.log('sending post to ' + url);
                contentType = contentType || "application/json";
                var request = new XMLHttpRequest();
                request.open('POST', url, true);
                request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                if( !isFormData ){
                    request.setRequestHeader("Content-type", contentType);
                }
                if( headers ){
                    for( var header in headers ){
                        request.setRequestHeader(header, headers[header]);
                    }
                }
                if( progressCallback ){
                    request.upload.addEventListener("progress", function(evt){
                        services.auth.updateLastActiveTimestamp();
                        if (evt.lengthComputable){
                            var percentComplete = evt.loaded / evt.total;
                            progressCallback(percentComplete, request);
                        }
                    }, false);
                }
                request.onabort = function(evt){
                    if( onabort ){
                        onabort();
                    }
                    reject(evt);
                };
                request.onerror = function(err){
                    if( onerror ){
                        request.onerror = onerror;
                    }
                    reject(err);
                };

                request.onreadystatechange = function() {
                    if (this.readyState === 4) {
                        if (this.status >= 200 && this.status < 400) {
                            if( this.responseText ){
                                var json = null;
                                try{
                                    json = JSON.parse(this.responseText);
                                    resolve(json);
                                }
                                catch(e){
                                    resolve(utils.extractResponseValues(this));
                                }
                            }
                            else{
                                resolve();
                            }
                        } else {
                            reject(utils.extractResponseValues(this));
                        }
                    }
                };
                if( data ){
                    request.send(isFormData ? data : JSON.stringify(data));
                }
                else{
                    request.send();
                }
            });
        },

        put: function(url, data, headers, isFormData, contentType){
            return new Promise(function(resolve, reject) {
                console.log('sending put to ' + url);
                contentType = contentType || "application/json";
                var request = new XMLHttpRequest();
                request.open('PUT', url, true);
                request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                if( !isFormData ){
                    request.setRequestHeader("Content-type", contentType);
                }
                if( headers ){
                    for( var header in headers ){
                        request.setRequestHeader(header, headers[header]);
                    }
                }
                //request.setRequestHeader("Connection", "close");
                request.onreadystatechange = function() {
                    if (this.readyState === 4) {
                        if (this.status >= 200 && this.status < 400) {
                            if( this.responseText ){
                                var json = null;
                                try{
                                    json = JSON.parse(this.responseText);
                                    resolve(json);
                                }
                                catch(e){
                                    resolve(utils.extractResponseValues(this));
                                }
                            }
                            else{
                                resolve();
                            }
                        } else {
                            reject(utils.extractResponseValues(this));
                        }
                    }
                };
                request.onabort = function(evt){
                    reject(evt);
                };
                request.onerror = function(err){
                    reject(err);
                };
                if( data ){
                    request.send(isFormData ? data : JSON.stringify(data));
                }
                else{
                    request.send();
                }

                request = null;
            });
        },

        doDelete: function(url, headers){
            return new Promise(function(resolve, reject) {
                console.log('sending delete to ' + url);
                var request = new XMLHttpRequest();
                request.open('DELETE', url, true);
                if( headers ){
                    for( var header in headers ){
                        request.setRequestHeader(header, headers[header]);
                    }
                }
                request.onreadystatechange = function() {
                    if (this.readyState === 4) {
                        if (this.status >= 200 && this.status < 400) {
                            services.auth.updateLastActiveTimestamp();
                            resolve();
                        } else {
                            reject(utils.extractResponseValues(this));
                        }
                    }
                };
                request.onabort = function(evt){
                    reject(evt);
                };
                request.onerror = function(err){
                    reject(err);
                };
                request.send();
                request = null;
            });
        },

        newUUID: function()  {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                return v.toString(16);
            });
        }
    };
}