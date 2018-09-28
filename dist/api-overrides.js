"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zlib_1 = __importDefault(require("zlib"));
const deep_extend_1 = __importDefault(require("deep-extend"));
const form_data_1 = __importDefault(require("form-data"));
const follow_redirects_1 = __importDefault(require("follow-redirects"));
const querystring_1 = __importDefault(require("querystring"));
const timed_out_1 = require("./timed-out");
const HTTP_REQ_TIMEOUT = 30000; // Time in milliseconds to wait for connect event on socket and also time to wait on inactive socket.
function apiOverrides(Api) {
    // used to store entity metadata responses
    let metaDataCache = {};
    /**
     * Override this method because we want only to provide username & not password - for example to get alternate user session with provided API key and username.
     *
     * Workfront own login method requires password to be present and does not support that password is empty and that's why we override it here with our requirement.
     *
     * @param username - Workfront username
     * @param password - Workfront password
     * @returns {any}
     */
    Api.prototype.login = function (username, password) {
        return this.request('login', (() => {
            console.log("logging in! Username: " + username);
            let params = { username: username };
            if (password) {
                params.password = password;
            }
            if (this.httpParams.apiKey) {
                params.apiKey = this.httpParams.apiKey;
            }
            return params;
        })(), null, Api.Methods.POST).then(function (data) {
            this.httpOptions.headers.sessionID = data.sessionID;
            return data;
        }.bind(this));
    };
    /**
     * Override the upload method as the one that comes from the "workfront-api" module does not take "apiKey" into account
     *
     * @param stream - a Buffer or stream
     * @param overrides - optionally provide filename and contentType
     * @returns {Promise<any>|Promise}
     */
    Api.prototype.upload = function (stream, overrides) {
        var form = new form_data_1.default();
        form.append('uploadedFile', stream, overrides);
        var options = {
            method: 'POST'
        };
        deep_extend_1.default(options, this.httpOptions);
        options.headers = form.getHeaders();
        //JO. Changed the following
        if (this.httpOptions.headers.sessionID) {
            options.headers.sessionID = this.httpOptions.headers.sessionID;
        }
        options.path += '/upload';
        // JO. Added this portion
        if (this.httpParams.apiKey) {
            options.path += '?apiKey=' + this.httpParams.apiKey;
        }
        delete options.headers['Content-Length'];
        var httpTransport = this.httpTransport;
        return new Promise(function (resolve, reject) {
            var request = httpTransport.request(options, this._handleResponse(resolve, reject));
            timed_out_1.TimedOut.applyToRequest(request, HTTP_REQ_TIMEOUT);
            // get content length and fire away
            form.getLength((err, length) => {
                if (err) {
                    reject(err);
                    return;
                }
                //console.log("Setting content-length: " + length);
                request.setHeader('Content-Length', length);
                form.pipe(request);
            });
            request.on('error', reject);
        }.bind(this));
    };
    /**
     * Override this for now, because if server is down (Gateway timeout comes back) then we get empty error message.
     * Here we just log the http response codes to notify that something is wrong
     *
     * @param resolve
     * @param reject
     * @returns {function(http.IncomingMessage): undefined}
     * @private
     */
    Api.prototype._handleResponse = (resolve, reject) => {
        return function (response) {
            let contentEncoding = response.headers['content-encoding'];
            console.log(`*** Response: ${response.statusCode}, ${response.statusMessage}, contentEncoding: ${contentEncoding}, response headers: ${JSON.stringify(response.headers)}`);
            // check content encoding
            var output;
            if (contentEncoding == 'gzip') {
                output = zlib_1.default.createGunzip();
                response.pipe(output);
            }
            else if (contentEncoding == 'deflate') {
                output = zlib_1.default.createInflate();
                response.pipe(output);
            }
            else {
                if (typeof response.setEncoding === 'function') {
                    response.setEncoding('utf8');
                }
                output = response;
            }
            // collect the response
            var body = '';
            output.on('data', function (chunk) {
                // chunk = chunk.toString('utf-8');
                //console.log(`HTTP receiving data: ${chunk}`);
                body += chunk;
            });
            output.on('end', function () {
                console.log(`HTTP response: ${body}`);
                // console.log(`Response headers: ${JSON.stringify(response.headers)}`);
                var data;
                try {
                    data = JSON.parse(body);
                }
                catch (e) {
                    reject(body);
                    return;
                }
                if (data.error) {
                    reject(data);
                }
                else if (response.statusCode != 200) { // If Workfront is down, then workfront http proxy returns 501 but with no content - so we want to catch that in here
                    reject(data);
                }
                else {
                    resolve(data.data);
                }
            });
            output.on('error', function (err) {
                console.log(`HTTP output error: ${err}`);
                return reject(err);
            });
        };
    };
    /**
     * Gives a user permissions to an object
     *
     * @param objId ID of the object to add permission to
     * @param userId ID of the user to give permissions to
     * @param objCode The object code for the obj to be granted permssions on
     * @param coreAction The coreAction. LIMITED_EDIT, VIEW, DELETE, etc.
     * @returns {any|http.ClientRequest|ClientRequest|any<request.Request, request.CoreOptions, request.RequiredUriUrl>}
     */
    Api.prototype.share = async function (objCode, objId, userId, coreAction) {
        let params = {
            accessorID: userId,
            accessorObjCode: "USER",
            coreAction: coreAction
        };
        if (this.httpParams.apiKey) {
            params.apiKey = this.httpParams.apiKey;
        }
        let endpoint = objCode + '/' + objId + '/share';
        let res = await this.request(endpoint, params, [], Api.Methods.PUT);
        return res;
    };
    /**
     * Retrieves metatada for an entity
     *
     * @param objCode The object code we want metadata for
     * @returns {Promise<MetaData>}
     */
    Api.prototype.metadata = function (objCode, useCache) {
        if (useCache && metaDataCache[objCode]) {
            // console.log(`Metadata from cache! ${objCode}`);
            return Promise.resolve(metaDataCache[objCode]);
        }
        let params = {};
        if (this.httpParams.apiKey) {
            params.apiKey = this.httpParams.apiKey;
        }
        let endpoint = objCode + "/metadata";
        // console.log(`Metadata from network! ${objCode}`);
        return this.request(endpoint, params, [], Api.Methods.GET).then((metaData) => {
            metaDataCache[objCode] = metaData;
            return metaData;
        });
    };
    /**
     * Download a document
     *
     * login() has to be called before calling download. Because sessionID needs to be set for download to work
     *
     * @param downloadURL - a download Url from Document
     * @param output - a Writable stream
     * @returns {Promise<void>|Promise}
     */
    Api.prototype.download = function (downloadURL, output) {
        var options = {
            method: 'GET'
        };
        deep_extend_1.default(options, this.httpOptions);
        options.headers = {};
        // User needs to be logged in before calling download
        // We cannot download only using an API key unfortunately
        if (!this.httpOptions.headers.sessionID) {
            throw new Error("Session ID is missing!");
        }
        options.headers.sessionID = this.httpOptions.headers.sessionID;
        options.path = downloadURL;
        //var httpTransport = this.httpTransport;
        var isHttps = this.httpOptions.protocol === 'https:';
        var httpTransport = isHttps ? follow_redirects_1.default.https : follow_redirects_1.default.http;
        return new Promise((resolve, reject) => {
            console.log("Making a download request: " + JSON.stringify(options) + ", session ID: " + this.httpOptions.headers.sessionID);
            var request = httpTransport.request(options, (response) => {
                console.log("*** Download response: " + response.statusCode + ", " + response.statusMessage);
                if (response.statusCode != 200) { // If Workfront is down, then workfront http proxy returns 501 but with no content - so we want to catch that in here
                    return reject(`Download failed! Response code: ${response.statusCode}, message: ${response.statusMessage}`);
                }
                // if (typeof response.setEncoding === 'function') {
                //     response.setEncoding('utf8');
                // }
                response.on("error", reject);
                response.pipe(output);
                output.on('finish', () => {
                    console.log(`HTTP download ended!`);
                    resolve();
                });
                // response.on('data', (chunk) => { output.write(chunk); });
                // response.on('end', () => { console.log(`HTTP download ended!`); resolve(); });
            });
            timed_out_1.TimedOut.applyToRequest(request, HTTP_REQ_TIMEOUT);
            request.on('error', reject);
            request.end();
        });
    };
    var requestHasData = function (method) {
        return method !== Api.Methods.GET && method !== Api.Methods.PUT;
    };
    /**
     * For different reasons we override this Workfront API method.
     * 1. It has deepExtend which fixes existing bug in Workfront API
     * 2. It logs requests to console before executing them for debugging purposes
     *
     * @param path
     * @param params
     * @param fields
     * @param method
     * @returns {Promise<T>|Promise}
     */
    Api.prototype.request = function (path, params, fields, method) {
        fields = fields || [];
        if (typeof fields === 'string') {
            fields = [fields];
        }
        params = params || {};
        // convert params object to updates={} for POST method only if specified via Symbol, PUT already sends via updates={} by default
        if (params && typeof params === "object") {
            if ((method === Api.Methods.POST) && params[Symbol.for("updates")] !== undefined) {
                let updates = {
                    updates: JSON.stringify(params)
                };
                params = updates;
            }
        }
        // append httpParams
        deep_extend_1.default(params, this.httpParams);
        var options = {}, alwaysUseGet = this.httpOptions.alwaysUseGet;
        deep_extend_1.default(options, this.httpOptions);
        if (alwaysUseGet) {
            params.method = method;
        }
        else {
            options.method = method;
        }
        if (path.indexOf('/') === 0) {
            options.path = this.httpOptions.path + path;
        }
        else {
            options.path = this.httpOptions.path + '/' + path;
        }
        if (fields.length !== 0) {
            params.fields = fields.join();
        }
        params = querystring_1.default.stringify(params);
        if (params) {
            if (!alwaysUseGet && requestHasData(options.method)) {
                options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
                options.headers['Content-Length'] = params.length;
            }
            else {
                options.path += '?' + params;
            }
        }
        // debug
        console.log(`Making a request: ${JSON.stringify(options)}, params: ${JSON.stringify(params)}`);
        // let configName = Config.instance().name;
        // if (configName == Config.OJA) {
        //     console.log(`Making a request: ${JSON.stringify(options)}, params: ${JSON.stringify(params)}`);
        // }
        var httpTransport = this.httpTransport;
        return new Promise(function (resolve, reject) {
            var request = httpTransport.request(options, this._handleResponse(resolve, reject));
            timed_out_1.TimedOut.applyToRequest(request, HTTP_REQ_TIMEOUT);
            request.on('error', reject);
            if (!alwaysUseGet && params && requestHasData(options.method)) {
                request.write(params);
            }
            request.end();
        }.bind(this));
    };
}
exports.apiOverrides = apiOverrides;
