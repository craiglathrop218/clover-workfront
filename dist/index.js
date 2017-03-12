/// <reference path='./workfront-api.d.ts' />
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as deepExtend from "deep-extend";
import * as FormData from "form-data";
import * as api from "workfront-api";
import * as queryString from "querystring";
import * as followRedirects from "follow-redirects";
import { TimedOut } from "./timed-out";
/**
 * Workfront API connection settings
 */
export let apiFactoryConfig = {
    url: "https://idt.my.workfront.com",
    //url: "https://idt.attasksandbox.com/" // TEST
    //version: "4.0"
    version: "5.0"
    //version: "internal"
};
var ApiFactory = api.ApiFactory;
var ApiConstants = api.ApiConstants;
var instance = ApiFactory.getInstance(apiFactoryConfig);
instance.httpParams.apiKey = "d0tz5bgzlif3fpdpap46lvqe9s727jfe"; // LIVE key
//instance.httpParams.apiKey = "2y1o1oc6p8umthza4z25bncdbixy54w2"; // TEST key
const HTTP_REQ_TIMEOUT = 30000; // Time in milliseconds to wait for connect event on socket and also time to wait on inactive socket.
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
api.Api.prototype.login = function (username, password) {
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
    })(), null, api.Api.Methods.POST).then(function (data) {
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
api.Api.prototype.upload = function (stream, overrides) {
    var form = new FormData();
    form.append('uploadedFile', stream, overrides);
    var options = {
        method: 'POST'
    };
    deepExtend(options, this.httpOptions);
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
        TimedOut.applyToRequest(request, HTTP_REQ_TIMEOUT);
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
 * @returns {function(IncomingMessage): undefined}
 * @private
 */
api.Api.prototype._handleResponse = (resolve, reject) => {
    return function (response) {
        console.log("*** Response: " + response.statusCode + ", " + response.statusMessage);
        var body = '';
        if (typeof response.setEncoding === 'function') {
            response.setEncoding('utf8');
        }
        response.on('data', function (chunk) {
            body += chunk;
        });
        response.on('end', function () {
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
            else if (response.statusCode != 200) {
                reject(data);
            }
            else {
                resolve(data.data);
            }
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
api.Api.prototype.share = function (objCode, objId, userId, coreAction) {
    return __awaiter(this, void 0, void 0, function* () {
        let params = {
            accessorID: userId,
            accessorObjCode: "USER",
            coreAction: coreAction
        };
        if (this.httpParams.apiKey) {
            params.apiKey = this.httpParams.apiKey;
        }
        let endpoint = objCode + '/' + objId + '/share';
        let res = yield this.request(endpoint, params, [], api.Api.Methods.PUT);
        return res;
    });
};
/**
 * Retrieves metatada for an entity
 *
 * @param objCode The object code we want metadata for
 * @returns {Promise<MetaData>}
 */
api.Api.prototype.metadata = function (objCode, useCache) {
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
    return this.request(endpoint, params, [], api.Api.Methods.GET).then((metaData) => {
        metaDataCache[objCode] = metaData;
        return metaData;
    });
};
var requestHasData = function (method) {
    return method !== api.Api.Methods.GET && method !== api.Api.Methods.PUT;
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
api.Api.prototype.download = function (downloadURL, output) {
    var options = {
        method: 'GET'
    };
    deepExtend(options, this.httpOptions);
    options.headers = {};
    if (!this.httpOptions.headers.sessionID) {
        throw new Error("Session ID is missing!"); // User needs to be logged in before calling download
    }
    options.headers.sessionID = this.httpOptions.headers.sessionID;
    options.path = downloadURL;
    //var httpTransport = this.httpTransport;
    var isHttps = this.httpOptions.protocol === 'https:';
    var httpTransport = isHttps ? followRedirects.https : followRedirects.http;
    return new Promise((resolve, reject) => {
        console.log("Making a download request: " + JSON.stringify(options) + ", session ID: " + this.httpOptions.headers.sessionID);
        var request = httpTransport.request(options, (response) => {
            console.log("*** Download response: " + response.statusCode + ", " + response.statusMessage);
            if (response.statusCode != 200) {
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
        TimedOut.applyToRequest(request, HTTP_REQ_TIMEOUT);
        request.on('error', reject);
        request.end();
    });
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
api.Api.prototype.request = function (path, params, fields, method) {
    fields = fields || [];
    if (typeof fields === 'string') {
        fields = [fields];
    }
    params = params || {};
    deepExtend(params, this.httpParams);
    var options = {}, alwaysUseGet = this.httpOptions.alwaysUseGet;
    deepExtend(options, this.httpOptions);
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
    params = queryString.stringify(params);
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
        TimedOut.applyToRequest(request, HTTP_REQ_TIMEOUT);
        request.on('error', reject);
        if (!alwaysUseGet && params && requestHasData(options.method)) {
            request.write(params);
        }
        request.end();
    }.bind(this));
};
/**
 * Parse user names (firstname, lastname) out from provided email address.
 *
 * Outlook sends out usernames in the format last, first. Gmail and other in the format first last. This
 * method splits the username into first and last and return an array where [0] is first name and [1] is
 * last name.
 *
 * @param addr - an email address where to parse the names from
 * @returns {UserNames} - user names (firstname, lastname)
 */
function parseEmailNames(addr) {
    let result = {};
    if (addr.name && addr.name.trim()) {
        // There is a name part in an email address, like "Jaanek Oja <jaanekoja@gmail.com>"
        if (addr.name.indexOf(",") > 0) {
            // Microsoft Outlook tends to put a , between the names and puts the last name first. We will look for that configuration first.
            let sep = addr.name.indexOf(",");
            result.lastName = addr.name.substr(0, sep).trim();
            result.firstName = addr.name.substr(sep + 1).trim();
        }
        else if (addr.name.indexOf(" ") > 0) {
            // Gmail and others
            let sep = addr.name.indexOf(" ");
            result.firstName = addr.name.substr(0, sep).trim();
            result.lastName = addr.name.substr(sep + 1).trim();
        }
        else {
            result.firstName = addr.name;
            result.lastName = "";
        }
    }
    else {
        // It's something non standard like no name and just an email address. For this we just make it work and put
        // the from name in both after forcing a string conversion.
        let sep = addr.address.indexOf("@");
        let mailboxName = addr.address.substr(0, sep).trim();
        result.firstName = mailboxName;
        result.lastName = mailboxName;
    }
    return result;
}
/**
 * Generate a random password for new users.
 *
 * @returns {string} - a new random password
 */
function randomPassword() {
    let alphabet = "abcdefghjklmnpqrstuwxyzABCDEFGHJKLMNPQRSTUWXYZ23456789";
    let result = [];
    let min = 0, max = alphabet.length - 1;
    for (let i = 0; i < 8; i++) {
        let n = Math.floor(Math.random() * (max - min)) + min;
        result.push(alphabet[n]);
    }
    return result.join("");
}
/**
 * A Workfront internal API for our project that provides a convenient and wrapped methods to be used in different usage scenarios.
 */
export var Workfront;
(function (Workfront) {
    // export the general API
    Workfront.api = instance;
    ;
    ;
    ;
    ;
    // This is just a meta data entity to hold document folder parent entity field name and value
    class DocumentFolderParentField {
        constructor(name, value) {
            this.name = name;
            this.value = value;
        }
    }
    Workfront.DocumentFolderParentField = DocumentFolderParentField;
    ;
    class Issue {
    }
    Issue.EXT_MSG_PREFIX = "FROM_EMAIL.MESSAGE_ID:";
    Workfront.Issue = Issue;
    class ReplyMessage {
        constructor() {
            this.isReply = false;
        }
    }
    Workfront.ReplyMessage = ReplyMessage;
    class IssueUpdate {
    }
    Workfront.IssueUpdate = IssueUpdate;
    // constants
    Workfront.API_DATE_FORMAT = "YYYY-MM-DD'T'HH:mm:ss:SSSZ"; // Date format in API requests: 2016-08-30T03:52:05:383-0700
    Workfront.DOCV_PROCESSED_MARK = "CLOVER-VER:".toUpperCase();
    /**
     * Login as a user with specified login email
     *
     * @param fromEmail - user login email
     * @returns {Promise<LoginResult>}
     */
    function login(fromEmail, waitDelay) {
        // NB! existing api instance (Workfront.api) is not safe to use while just replacing a sessionId over there
        // For that reason, we create a new instance of api
        let api = ApiFactory.getInstance(apiFactoryConfig, true);
        api.httpParams.apiKey = instance.httpParams.apiKey;
        // if there is wait delay specified after a login
        if (waitDelay) {
            return new Promise((resolve, reject) => {
                api.login(fromEmail.address).then((login) => {
                    console.log(`Login delay: ${waitDelay}`);
                    setTimeout(() => {
                        resolve(login);
                    }, waitDelay);
                }).catch((error) => {
                    reject(error);
                });
            });
        }
        else {
            return api.login(fromEmail.address);
        }
    }
    Workfront.login = login;
    /**
     * Login as a user with specified login email
     *
     * @param fromEmail - user login email
     * @returns {Promise<LoginResult>}
     */
    function logout(login) {
        // NB! existing api instance (Workfront.api) is not safe to use while just replacing a sessionId over there
        // For that reason, we create a new instance of api
        let api = ApiFactory.getInstance(apiFactoryConfig, true);
        delete api.httpParams.apiKey; // This needs to be here, otherwise entity is created under apiKey user
        api.httpOptions.headers.sessionID = login.sessionID;
        return api.logout();
    }
    Workfront.logout = logout;
    function execAsUserWithSession(console, fromEmail, callback, login) {
        console.log("*** Executing as User (with existing login session). Email: " + fromEmail.address + ", login session: " + JSON.stringify(login));
        // NB! existing api instance (Workfront.api) is not safe to use while just replacing a sessionId over there
        // For that reason, we create a new instance of api
        let api = ApiFactory.getInstance(apiFactoryConfig, true);
        delete api.httpParams.apiKey; // This needs to be here, otherwise entity is created under apiKey user
        api.httpOptions.headers.sessionID = login.sessionID;
        // login and execute provided function under a user
        let updated = new Promise((resolve, reject) => {
            callback(api, login).then((result) => {
                console.log("Execute as user finished, result: " + JSON.stringify(result));
                resolve(result);
            }).catch((error) => {
                console.log(error);
                console.log(`Error. User: ${fromEmail.address}, error: ${JSON.stringify(error)}`);
                reject(error);
            });
        });
        return updated;
    }
    /**
     * Logs in as user and execute provided function
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param fromEmail - execute a provided function under this user
     * @param callback - a function to execute under logged in user
     * @returns {Promise<T} - T
     */
    function execAsUser(console, fromEmail, callback) {
        // check if we have WfContext coming in, if so then if not already logged in then login
        if (console.getSession && console.setSession) {
            let ctx = console;
            let login = ctx.getSession(fromEmail.address);
            if (!login) {
                // login first
                console.log(`*** No login session found for user email: ${fromEmail.address}. Getting a new session.`);
                return Workfront.login(fromEmail, 5000).then((login) => {
                    console.log("Got login session for user: " + fromEmail.address + ", user id: " + login.userID + ", sessionId: " + login.sessionID);
                    ctx.setSession(fromEmail.address, login);
                    return execAsUserWithSession(console, fromEmail, callback, login);
                });
            }
            else {
                console.log(`Existing login session found for user email: ${fromEmail.address}, user id: ${login.userID}, sessionId: ${login.sessionID}`);
                return execAsUserWithSession(console, fromEmail, callback, login);
            }
        }
        else {
            console.log("*** Executing as User (with logging in first). Email: " + fromEmail.address);
            // NB! existing api instance (Workfront.api) is not safe to use while just replacing a sessionId over there
            // For that reason, we create a new instance of api
            let api = ApiFactory.getInstance(apiFactoryConfig, true);
            api.httpParams.apiKey = instance.httpParams.apiKey;
            // login and execute provided function under a user
            let updated = new Promise((resolve, reject) => {
                api.login(fromEmail.address).then((login) => {
                    delete api.httpParams.apiKey; // This needs to be here, otherwise entity is created under apiKey user
                    let userId = login.userID;
                    let sessionId = login.sessionID;
                    console.log("Got login session for user: " + fromEmail.address + ", user id: " + userId + ", sessionId: " + sessionId);
                    return callback(api, login).then((result) => {
                        console.log("Execute as user finished, result: " + JSON.stringify(result));
                        return result;
                    });
                }).then((result) => {
                    console.log("Logging out! User: " + fromEmail.address);
                    api.logout().then(() => {
                        console.log(`Logout success!`);
                        resolve(result);
                    }).catch((logoutError) => {
                        console.log(`Error while trying to logout! Error ${logoutError}`);
                        // anyway we are done with a call, so resolve it as success
                        resolve(result);
                    });
                    //api.logout();
                }).catch((error) => {
                    console.log(error);
                    console.log(`Error. Logging out! User: ${fromEmail.address}, error: ${JSON.stringify(error)}`);
                    api.logout().then(() => {
                        console.log(`Logout success!`);
                        reject(error);
                    }).catch((logoutError) => {
                        console.log(`Error while trying to logout! Error ${logoutError}`);
                        // anyway we are done with a call, so resolve it as success
                        reject(error);
                    });
                    //api.logout();
                });
            });
            return updated;
        }
    }
    Workfront.execAsUser = execAsUser;
    /**
     * Fetches a project from Workfront based on provided project id.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param projId - project id to fetch
     * @param fields - extra fields to return for the project
     * @returns {Promise<Project>} - fetched project
     */
    function getProjectById(console, projId, fields) {
        console.log("Getting Project by id: " + projId);
        return Workfront.api.get("PROJ", projId, fields).then((project) => {
            return project;
        });
    }
    Workfront.getProjectById = getProjectById;
    /**
     * Searches for a project from Workfront based on provided project reference nr.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param refNr - project reference nr.
     * @returns {Promise<Project>} - a project if found, otherwise null
     */
    function getProjectByRefNr(console, refNr) {
        return Workfront.api.search("PROJ", {
            referenceNumber: refNr,
            referenceNumber_Mod: "eq"
        }, ["referenceNumber"]).then((projects) => {
            if (projects.length) {
                return projects[0];
            }
            else {
                return null;
            }
        });
    }
    Workfront.getProjectByRefNr = getProjectByRefNr;
    /**
     * Upload provided attachments to the Workfront server.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param attachments - attachments to upload
     * @returns {Promise<Upload>|Promise} - an object containing provided attachments and Workfront reference handles to them
     */
    function uploadMailAttachmentsAsUser(console, fromEmail, attachments) {
        console.log(`Uploading mail attachments as user ${fromEmail.address}, attachments: ${attachments}!`);
        if (attachments && attachments.length) {
            return execAsUser(console, fromEmail, (api, login) => {
                let allUploads = new Array();
                for (let att of attachments) {
                    let data = att.content;
                    //console.log("Content object type: " + data.constructor);
                    allUploads.push(api.upload(data, { filename: att.fileName, contentType: att.contentType }));
                }
                return Promise.all(allUploads).then((data) => {
                    console.log("Attachments uploaded!");
                    return { attachments: attachments, handles: data };
                });
            });
        }
        else {
            console.log("Email has no attachments!");
            return Promise.resolve();
        }
    }
    Workfront.uploadMailAttachmentsAsUser = uploadMailAttachmentsAsUser;
    /**
     * Fetches an existing user from Workfront based on provided email address or if not found then creates a new user.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param fromEmail - an email address of a user that sent the email
     * @param accessConfigs - the workfront access settings / levels for a user
     * @returns {Promise<User>|Promise}
     */
    function getOrCreateUser(console, fromEmail, accessConfigs, fetchSsoId) {
        let isIDTEmployee = fromEmail.address.indexOf("@idt.com") > 0 ? true : false;
        // Set user access levels/settings if new user needs to be created 
        let accessConfig = {
            accessLevelID: accessConfigs.externalUsers.accessLevelID,
            companyID: accessConfigs.externalUsers.companyID,
            homeGroupID: accessConfigs.externalUsers.homeGroupID
        };
        if (isIDTEmployee) {
            // User has an @idt.com address. IDT company code and proper access level
            accessConfig.accessLevelID = accessConfigs.idtUsers.accessLevelID;
            accessConfig.companyID = accessConfigs.idtUsers.companyID;
            accessConfig.homeGroupID = accessConfigs.idtUsers.homeGroupID;
        }
        let queryFields = ["emailAddr", "firstName", "lastName"]; // additional fields to return
        let userDone = new Promise((resolve, reject) => {
            // First, check if that user already exists
            Workfront.api.search("USER", {
                emailAddr: fromEmail.address,
                emailAddr_Mod: "cieq"
            }, queryFields).then((users) => __awaiter(this, void 0, void 0, function* () {
                console.log(`getOrCreateUser. Got users: ${users}`);
                if (users && users.length > 1) {
                    return Promise.reject("Multiple users returned for an email: " + fromEmail.address);
                }
                if (users && users.length) {
                    // we have found an existing user
                    console.log("*** User found by email: " + fromEmail.address);
                    return users[0];
                }
                else {
                    // user not found
                    console.log("*** User not found by email: " + fromEmail.address);
                    // check if we need to get ssoId
                    let ssoId = null;
                    if (fetchSsoId && isIDTEmployee) {
                        ssoId = yield fetchSsoId(fromEmail.address);
                        console.log(`*** IDT Employee. User sso id: ${ssoId}`);
                    }
                    // Create a new user
                    let userNames = parseEmailNames(fromEmail);
                    return Workfront.api.create("USER", (() => {
                        let params = {
                            firstName: userNames.firstName,
                            lastName: userNames.lastName,
                            emailAddr: fromEmail.address,
                            accessLevelID: accessConfig.accessLevelID,
                            companyID: accessConfig.companyID,
                            homeGroupID: accessConfig.homeGroupID
                        };
                        if (ssoId) {
                            params.ssoUsername = ssoId;
                        }
                        return params;
                    })(), queryFields).then((user) => {
                        // User created
                        console.log("*** User created! User: " + JSON.stringify(user));
                        if (!user.ID) {
                            return Promise.reject("Something went wrong while creating a new user! User ID is not defined! Result: " + JSON.stringify(user));
                        }
                        // If we have an external user to IDT then we must assign a username and password for that user
                        if (isIDTEmployee == false) {
                            console.log("*** Assigning a token to the user!");
                            // First, get a token for the registration process
                            return Workfront.api.execute("USER", user.ID, 'assignUserToken').then((token) => {
                                console.log(`Got token for new user! Token: ${JSON.stringify(token)}`);
                                return Promise.resolve(token);
                            }).then((token) => {
                                console.log("*** Generate password!");
                                // now that we have a token, finish the registration
                                user.password = randomPassword();
                                // For unknown reasons you need to send the first and last name in again when completing the user reg. Just an AtTask thing.
                                return Workfront.api.execute("USER", user.ID, 'completeUserRegistration', {
                                    firstName: userNames.firstName,
                                    lastName: userNames.lastName,
                                    token: token.result,
                                    title: "",
                                    newPassword: user.password
                                });
                            }).then((data) => {
                                // For some reason when this works it only returns null ({"result":null}). I swear it wasn't doing that last week (11/25/14) today.
                                console.log(`User registration complete! Result: ${JSON.stringify(data)}. User ID: ${user.ID}`);
                                return user;
                            }).catch((error) => {
                                return Promise.reject(error);
                            });
                        }
                        else {
                            console.log(`IDT user! User ID: ${user.ID}`);
                            return user;
                        }
                    }).then((user) => {
                        return user;
                    }).catch((error) => {
                        return Promise.reject(error);
                    });
                }
            })).then((user) => {
                console.log("User: " + JSON.stringify(user));
                resolve(user);
            }).catch(reject);
        });
        return userDone;
    }
    Workfront.getOrCreateUser = getOrCreateUser;
    /**
     * For all provided user email addresses create corresponding user objects in Workfront.
     *
     * @returns {Promise<T>|Promise<R>|Promise} - created user objects
     */
    function getOrCreateUsersByEmail(console, userEmails, emailsToIgnore, otherConfigs, fetchSsoId) {
        console.log(`Get or create users by email! Emails: ${JSON.stringify(userEmails)}`);
        // ignore service mailbox emails
        let ignoreEmails = new Set();
        // add all mail account emails to ignore
        for (let email of emailsToIgnore) {
            ignoreEmails.add(email.toLowerCase());
        }
        ignoreEmails.add("webmaster@idt.com");
        //
        let usersFetched = [];
        for (let userEmail of userEmails) {
            // Sometimes distribution lists are copied when submitting a request. We do not want to create them as a user.
            // Some distribution lists start with "corp", and some start with "kk" (for unknown reasons).
            if (userEmail.address.substr(0, 2) != "kk" && userEmail.address.substr(0, 4) != "corp" && !ignoreEmails.has(userEmail.address.toLowerCase())) {
                usersFetched.push(getOrCreateUser(console, userEmail, otherConfigs.accessConfigs, fetchSsoId));
            }
        }
        return Promise.all(usersFetched).then((users) => {
            console.log("Users fetched or created! " + JSON.stringify(users));
            return users;
        });
    }
    Workfront.getOrCreateUsersByEmail = getOrCreateUsersByEmail;
    /**
     * Fetches a user from Workfront based on provided user id.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param userId - user id to fetch
     * @param fields - extra fields to return for user
     * @returns {Promise<User>} - fetched user
     */
    function getUserById(console, userId, fields) {
        console.log("Getting User by id: " + userId);
        return Workfront.api.get("USER", userId, fields).then((user) => {
            return user;
        });
    }
    Workfront.getUserById = getUserById;
    /**
     * Fetches a team from Workfront based on provided team id.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param teamId - team id to fetch
     * @param fields - extra fields to return for team
     * @returns {Promise<Team>} - fetched team
     */
    function getTeamById(console, teamId, fields) {
        console.log("Getting Team by id: " + teamId);
        return Workfront.api.get("TEAMOB", teamId, fields).then((team) => {
            return team;
        });
    }
    Workfront.getTeamById = getTeamById;
    /**
     * Fetches an issue from Workfront based on provided issue id.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param issueId - issue id to fetch
     * @param fields - extra fields to return for an issue
     * @returns {Promise<Issue>} - fetched issue
     */
    function getIssueById(console, issueId, fields) {
        console.log("Getting Issue by id: " + issueId);
        return Workfront.api.get("OPTASK", issueId, fields).then((issue) => {
            return issue;
        });
    }
    Workfront.getIssueById = getIssueById;
    /**
     * Searches for an issue from Workfront based on provided external extRefID - email id.
     *
     * If email comes in then an email id is put into a field named "extRefID" on an issue. So we can search later for an existing issue based on that field.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param extRefID - an email id.
     * @returns {Promise<Issue>} - an issue if found based on email id
     */
    function getIssueByExtId(console, extRefID) {
        console.log("Checking issue existence by extRefId: " + extRefID);
        return Workfront.api.search("OPTASK", {
            extRefID: extRefID,
            extRefID_Mod: "eq"
        }).then((issues) => {
            if (issues && issues.length > 1) {
                return Promise.reject(Error("More than one issue found for message id: " + extRefID));
            }
            else if (issues.length) {
                return issues[0];
            }
            else {
                return null;
            }
        });
    }
    Workfront.getIssueByExtId = getIssueByExtId;
    /**
     * A generic function for updating any object on behalf of another user.
     * @param userEmail
     * @param updates
     * @param objId
     * @param objCode
     * @param fields
     * @returns {any}
     */
    // @todo see if we can replace the specific "updateIssueAsUser" function with this more generic one.
    function makeUpdatesAsUser(console, from, entityRef, updates, fields = []) {
        return execAsUser(console, from, (api, login) => {
            console.log("[makeUpdateAsUser] - Got login session for user: " + from.address + ", sessionId: " + login.sessionID);
            // update
            return api.edit(entityRef.objCode, entityRef.ID, updates, fields).then((updatedObj) => {
                console.log(`[makeUpdateAsUser] ${entityRef.objCode}, ID: ${entityRef.ID}, updates: ${JSON.stringify(updatedObj)}`);
                return updatedObj;
            });
        });
    }
    Workfront.makeUpdatesAsUser = makeUpdatesAsUser;
    /**
     * Searches for an issue from Workfront based on provided issue reference nr.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param refNr - issue reference nr. Got from an email body
     * @returns {Promise<Issue>} - an issue if found, otherwise null
     */
    function getIssueByRefNr(console, refNr) {
        return Workfront.api.search("OPTASK", {
            referenceNumber: refNr,
            referenceNumber_Mod: "eq"
        }, ["referenceNumber"]).then((issues) => {
            if (issues.length) {
                return issues[0];
            }
            else {
                return null;
            }
        });
    }
    Workfront.getIssueByRefNr = getIssueByRefNr;
    /**
     * Creates a new Issue with provided fields.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param params - fields to be set on an issue
     * @returns {Promise<Issue>} - created Issue
     */
    function createIssueAsUser(console, fromEmail, params) {
        console.log("*** Creating issue! Params: " + JSON.stringify(params));
        return execAsUser(console, fromEmail, (api) => {
            return api.create("OPTASK", params);
        });
    }
    Workfront.createIssueAsUser = createIssueAsUser;
    /**
     * Update issue as a user with provided email.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param fromEmail - update issue as a user with this provided email
     * @param issueId - issue id to update
     * @param updates - fields to update
     * @param fields - extra fields to return
     * @returns {Promise<Issue>|Promise} - update Issue
     */
    function updateIssueAsUser(console, fromEmail, issueId, updates, fields) {
        console.log("*** Updating issue as User. Email: " + fromEmail.address + ", updates: " + JSON.stringify(updates));
        return execAsUser(console, fromEmail, (api, login) => {
            // update
            return api.edit("OPTASK", issueId, updates, fields).then((issue) => {
                console.log("Issue updated: " + JSON.stringify(issue));
                return issue;
            });
        });
    }
    Workfront.updateIssueAsUser = updateIssueAsUser;
    /**
     * Creates a new Document Folder under a parent with provided fields.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param params - fields to be set on an issue
     * @returns {Promise<DocumentFolder>} - created Document Folder
     */
    function createFolderAsUser(console, fromEmail, params, fields) {
        console.log("*** Creating document folder! Params: " + JSON.stringify(params));
        return execAsUser(console, fromEmail, (api) => {
            return api.create("DOCFDR", params, fields);
        });
    }
    Workfront.createFolderAsUser = createFolderAsUser;
    /**
     * Searches for a task based on task ref nr.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param refNr - a reference number got from email body
     * @returns {Promise<Task>} - a task if found, otherwise null
     */
    function getOrCreateDocumentFolder(console, fromEmail, folderParentField, folderName, fields, parentFolderId) {
        if (!folderParentField) {
            return Promise.reject(`Document folder parent entity field name (issueID, taskID, projectID) is required to create a folder! Requested folder name: ${folderName}`);
        }
        console.log(`*** Searching document folder! Folder name: ${folderName}, entity field: ${JSON.stringify(folderParentField)}, parent folder id: ${parentFolderId}`);
        return Workfront.api.search("DOCFDR", (() => {
            let params = {
                name: folderName,
                name_Mod: "cieq"
            };
            params[folderParentField.name] = folderParentField.value;
            if (parentFolderId) {
                params.parentID = parentFolderId;
            }
            return params;
        })(), fields).then((docFolders) => {
            if (docFolders.length) {
                let docFolder = docFolders[0];
                docFolder.folderParentField = folderParentField;
                return docFolder;
            }
            else {
                return createFolderAsUser(console, fromEmail, (() => {
                    let params = {
                        name: folderName
                    };
                    params[folderParentField.name] = folderParentField.value;
                    if (parentFolderId) {
                        params.parentID = parentFolderId;
                    }
                    return params;
                })(), fields).then((docFolder) => {
                    docFolder.folderParentField = folderParentField;
                    return docFolder;
                });
            }
        });
    }
    Workfront.getOrCreateDocumentFolder = getOrCreateDocumentFolder;
    /**
     * Creates new documents from uploaded entities and sets a reference to provided parent entity - issue for example.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param parentRef - reference to entity the created docuements are related to
     * @param upload - references to upload entities
     * @returns {Promise<Document[]>|Promise} - created documents
     */
    function createDocumentsAsUser(console, fromEmail, parentRef, upload, docFieldsToReturn, docFolder) {
        return execAsUser(console, fromEmail, (api, login) => {
            let allPromises = new Array();
            for (let i = 0; i < upload.attachments.length; i++) {
                let att = upload.attachments[i];
                let handle = upload.handles[i];
                // verify that document has a name
                let docName = att.fileName;
                if (!docName) {
                    docName = att.generatedFileName;
                }
                if (!docName) {
                    docName = "unknown";
                }
                // create documents
                allPromises.push(api.create("DOCU", (() => {
                    let params = {
                        name: docName,
                        docObjCode: parentRef.objCode,
                        objID: parentRef.ID,
                        handle: handle.handle
                        // currentVersion: {
                        //     version: "1.0",
                        //     fileName: att.fileName
                        // }
                    };
                    if (docFolder) {
                        params.folderIDs = [docFolder.ID];
                    }
                    return params;
                })(), docFieldsToReturn));
            }
            return Promise.all(allPromises).then((docs) => {
                return docs;
            });
        });
    }
    Workfront.createDocumentsAsUser = createDocumentsAsUser;
    /**
     * Fetches a document from Workfront based on provided document id.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param docId - document id to fetch
     * @param fields - extra fields to return for a document
     * @returns {Promise<Document>} - fetched document
     */
    function getDocumentById(console, docId, fields) {
        console.log("Getting Document by id: " + docId);
        return Workfront.api.get("DOCU", docId, fields).then((doc) => {
            return doc;
        });
    }
    Workfront.getDocumentById = getDocumentById;
    /**
     * Fetches a document version from Workfront based on provided document version id.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param docVerId - document version id to fetch
     * @param fields - extra fields to return for a document version
     * @returns {Promise<DocumentVersion>} - fetched document version
     */
    function getDocumentVersionById(console, docVerId, fields) {
        console.log("Getting Document Version by id: " + docVerId + ", fields to return: " + JSON.stringify(fields));
        return Workfront.api.get("DOCV", docVerId, fields).then((docVer) => {
            return docVer;
        });
    }
    Workfront.getDocumentVersionById = getDocumentVersionById;
    /**
     * Creates a note under a provided user email.
     *
     * A user with provided email must exist in Workfront, otherwise a reject error is returned
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param user - a user email under which to create a note
     * @param params - note fields
     * @returns {Promise<Note>|Promise} - created note
     */
    function createNoteAsUser(console, user, params) {
        console.log("*** Creating Note with User email: " + user.address + ", params: " + JSON.stringify(params));
        return execAsUser(console, user, (api, login) => {
            let userId = login.userID;
            // create a note
            let fieldsToReturn = ["ownerID"];
            params.ownerID = userId;
            return api.create("NOTE", params, fieldsToReturn).then((note) => {
                //console.log("Note created: " + JSON.stringify(note));
                return note;
            });
        });
    }
    Workfront.createNoteAsUser = createNoteAsUser;
    /**
     * Create a reply note as a user with provided email.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param fromEmail - create a new reply note as a user with this provided email
     * @param reply - a reply object containing target entity and reply message
     * @returns {Promise<Note>|Promise} - a new reply Note object that was created
     */
    function createReplyNoteAsUser(console, fromEmail, reply, replyToEntityRef) {
        console.log("*** Creating Reply Note with User email: " + fromEmail.address + ", note update: " + JSON.stringify(reply));
        return execAsUser(console, fromEmail, (api, login) => {
            console.log(`Starting to create reply note! From: ${JSON.stringify(fromEmail)}, login: ${JSON.stringify(login)}, reply to entity ref: ${JSON.stringify(replyToEntityRef)}, reply note: ${JSON.stringify(reply)}`);
            let userId = login.userID;
            // create a note
            let params = {};
            switch (replyToEntityRef.objCode) {
                case "OPTASK": {
                    params.opTaskID = replyToEntityRef.ID;
                    break;
                }
                case "PROJ": {
                    params.projectID = replyToEntityRef.ID;
                    break;
                }
                case "TASK": {
                    params.taskID = replyToEntityRef.ID;
                    break;
                }
                case "PORT": {
                    params.portfolioID = replyToEntityRef.ID;
                    break;
                }
                case "PRGM": {
                    params.programID = replyToEntityRef.ID;
                    break;
                }
                case "DOCU": {
                    params.documentID = replyToEntityRef.ID;
                    break;
                }
                case "TMPL": {
                    params.templateID = replyToEntityRef.ID;
                    break;
                }
                case "TTSK": {
                    params.templateTaskID = replyToEntityRef.ID;
                    break;
                }
                default: {
                    return Promise.reject(`!!!!ERROR!!!! An unrecognized object type ${replyToEntityRef.objCode} was just entered.`);
                }
            }
            if (reply.parentJournalEntryID) {
                params.parentJournalEntryID = reply.parentJournalEntryID;
            }
            params.noteObjCode = replyToEntityRef.objCode;
            params.objID = replyToEntityRef.ID;
            params.noteText = reply.textMsg.trim();
            if (reply.threadID) {
                params.threadID = reply.threadID;
                // If it's a journal entry response then there is no parentNoteID
                if (!reply.parentJournalEntryID) {
                    params.parentNoteID = reply.threadID;
                }
            }
            params.isReply = reply.isReply;
            params.ownerID = userId;
            // fill in extRefID if caller requests that this note must be skipped by updates-checker
            if (reply.extRefID) {
                params.extRefID = reply.extRefID;
            }
            // create a new note
            console.log(`Starting to create reply note 2! ${JSON.stringify(login)}`);
            return api.create("NOTE", params).then((note) => {
                console.log(`Note created to ${params.noteObjCode}:${params.objID}: ${reply.textMsg.substring(0, 50)}...`);
                return note;
            });
        });
    }
    Workfront.createReplyNoteAsUser = createReplyNoteAsUser;
    /**
     * Fetches the Note object from Workfront based on provided note id.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param noteId - note id
     * @param fields - extra fields to return
     * @returns {Promise<Note>} - Note object corresponding to provided note id
     */
    function getNoteById(console, noteId, fields) {
        console.log("Getting Note by id: " + noteId);
        return Workfront.api.get("NOTE", noteId, fields).then((note) => {
            return note;
        });
    }
    Workfront.getNoteById = getNoteById;
    /**
     * Fetches the Note object from Workfront based on referenced journal entry id.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param journalEntryId - journal entry id
     * @param fields - extra fields to return
     * @returns {Promise<Note>} - Note object corresponding to provided note id
     */
    function getJournalEntryById(console, journalEntryId, fields) {
        console.log("Getting Journal Entry by id: " + journalEntryId);
        return Workfront.api.get("JRNLE", journalEntryId, fields).then((jrnle) => {
            return jrnle;
        });
        // return Workfront.api.search<Note[]>("NOTE", {
        //     parentJournalEntryID: journalEntryId
        // }, fields).then((notes: Note[]) => {
        //     if (notes && notes.length > 1) {
        //         return Promise.reject(Error("More than one note found for note with id: " + journalEntryId));
        //     } else if (notes.length) {
        //         return notes[0];
        //     } else {
        //         return null;
        //     }
        // });
    }
    Workfront.getJournalEntryById = getJournalEntryById;
    /**
     * Searches for a task based on task ref nr.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param refNr - a reference number got from email body
     * @returns {Promise<Task>} - a task if found, otherwise null
     */
    function getTaskByRefNr(console, refNr) {
        return Workfront.api.search("TASK", {
            referenceNumber: refNr,
            referenceNumber_Mod: "eq"
        }, ["referenceNumber"]).then((tasks) => {
            if (tasks.length) {
                return tasks[0];
            }
            else {
                return null;
            }
        });
    }
    Workfront.getTaskByRefNr = getTaskByRefNr;
    /**
     * Update existing task as a user with provided email.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param fromEmail - update task as a user with this email
     * @param taskId - task id to update
     * @param updates - update fields on task
     * @returns {Promise<Task>|Promise} - update task
     */
    function updateTaskAsUser(console, fromEmail, taskId, updates) {
        console.log("*** Updating task as User. Email: " + fromEmail.address + ", updates: " + JSON.stringify(updates));
        return execAsUser(console, fromEmail, (api, login) => {
            // update
            return api.edit("TASK", taskId, updates).then((task) => {
                console.log("Task updated: " + JSON.stringify(task));
                return task;
            });
        });
    }
    Workfront.updateTaskAsUser = updateTaskAsUser;
    /**
     * Query for team members
     */
    function getTeamMembers(console, teamId) {
        let fieldsToReturn = ["ID", "name", "teamMembers:*"];
        return Workfront.api.get("TEAMOB", teamId, fieldsToReturn).then((team) => {
            return team.teamMembers;
        });
        // THE FOLLOWING returns an error: "TEAMMB is not a top level object and can't be requested directly in internal"
        // return Workfront.api.search<TeamMember[]>("TEAMMB", (() => {
        //     let params: any = {
        //         teamID: teamID
        //     };
        //     if (customerID) {
        //         params.customerID = customerID;
        //     }
        //     return params;
        // })(), fieldsToReturn).then((teamMember: TeamMember[]) => {
        //     console.log("Team members len: " + teamMember.length);
        //     return teamMember;
        // });
    }
    Workfront.getTeamMembers = getTeamMembers;
    // /**
    //  * Get all journal entries for an entity
    //  *
    //  * Currently fetches only max 100 updates by default - @see https://developers.workfront.com/api-docs/#Limits
    //  */
    // export function fetchEntityJournalEntries(console: Logger, entityObjCode: string, entityObjID: string, fetchTopNotes: boolean, fieldsToReturn?: string|string[]): Promise<JournalEntry[]> {
    //     return Workfront.api.search<JournalEntry[]>("JRNLE", (() => {
    //         let params = {
    //             entryDate_Sort: "desc", // Newest first - http://stackoverflow.com/questions/28313311/attask-api-order-by-date
    //             subObjCode: "DOCU"
    //             // projectID: "55ea170400354a10eee2caab62299b78",
    //             //ownerID: "5713e0c5000f8edaa77bbdf03aa9886e" // TESTING
    //         };
    //         if (fetchTopNotes) {
    //             params.topObjCode = entityObjCode;
    //             params.topObjID = entityObjID;
    //         } else {
    //             params.objObjCode = entityObjCode;
    //             params.objID = entityObjID;
    //         }
    //         return params;
    //     })(), fieldsToReturn).then((jrnls: JournalEntry[]) => {
    //         console.log("Journal Entries len: " + jrnls.length);
    //         return jrnls;
    //     });
    // }
    //
    // /**
    //  * Fetch new Journal entries
    //  *
    //  * Currently fetches only max 100 updates by default - @see https://developers.workfront.com/api-docs/#Limits
    //  */
    // export function fetchNewJournalEntries(console: Logger, fieldsToReturn?: string|string[]): Promise<JournalEntry[]> {
    //     return Workfront.api.search<Note[]>("JRNLE", {
    //         extRefID_Mod: "isnull",
    //         entryDate: "2016-10-01T06:00:00",
    //         entryDate_Mod: "gte",
    //         entryDate_Sort: "desc",
    //         projectID: "55ea170400354a10eee2caab62299b78"
    //         //projectID: "573212fd003bc076655b388f2101b8f2"
    //         // Newest first - http://stackoverflow.com/questions/28313311/attask-api-order-by-date
    //         // entryDate: "$$TODAY-1d",
    //         // entryDate_Range: "$$TODAY",
    //         // entryDate_Mod: "between",  // just for testing. entryDate=$$TODAY-7d&entryDate_Range=$$TODAY&entryDate_Mod=between... . Entry date looks like: "entryDate":"2016-08-16T19:45:09:860-0700"
    //     }, fieldsToReturn).then((jrnls: JournalEntry[]) => {
    //         console.log("Journal Entries len: " + jrnls.length);
    //         return jrnls;
    //     });
    // }
    // /**
    //  * Get all notes for an entity
    //  *
    //  * Currently fetches only max 100 updates by default - @see https://developers.workfront.com/api-docs/#Limits
    //  */
    // export function fetchEntityNotes(console: Logger, entityObjCode: string, entityObjID: string, fetchTopNotes: boolean, fieldsToReturn?: string|string[]): Promise<Note[]> {
    //     return Workfront.api.search<Note[]>("NOTE", (() => {
    //         let params = {
    //             isReply: false,
    //             entryDate_Sort: "desc", // Newest first - http://stackoverflow.com/questions/28313311/attask-api-order-by-date
    //             // projectID: "55ea170400354a10eee2caab62299b78",
    //             //ownerID: "5713e0c5000f8edaa77bbdf03aa9886e" // TESTING
    //         };
    //         if (fetchTopNotes) {
    //             params.topNoteObjCode = entityObjCode;
    //             params.topObjID = entityObjID;
    //         } else {
    //             params.noteObjCode = entityObjCode;
    //             params.objID = entityObjID;
    //         }
    //         return params;
    //     })(), fieldsToReturn).then((notes: Note[]) => {
    //         console.log("Notes len: " + notes.length);
    //         return notes;
    //     });
    // }
    // /**
    //  * Fetch new Journal entries
    //  *
    //  * Currently fetches only max 100 updates by default - @see https://developers.workfront.com/api-docs/#Limits
    //  */
    // export function fetchNewDocVJournalEntries(console: Logger, fieldsToReturn?: string|string[]): Promise<JournalEntry[]> {
    //     return Workfront.api.search<JournalEntry[]>("JRNLE", {
    //         subObjCode: "DOCV", // Filter only to return new document version journal entries
    //         extRefID_Mod: "isnull",
    //         entryDate: "2016-10-07T12:00:00",
    //         entryDate_Mod: "gte",
    //         entryDate_Sort: "desc",
    //         projectID: "55ea170400354a10eee2caab62299b78",
    //         //projectID: "573212fd003bc076655b388f2101b8f2"
    //         editedByID: "5713e0c5000f8edaa77bbdf03aa9886e" // TESTING
    //         // Newest first - http://stackoverflow.com/questions/28313311/attask-api-order-by-date
    //         // entryDate: "$$TODAY-1d",
    //         // entryDate_Range: "$$TODAY",
    //         // entryDate_Mod: "between",  // just for testing. entryDate=$$TODAY-7d&entryDate_Range=$$TODAY&entryDate_Mod=between... . Entry date looks like: "entryDate":"2016-08-16T19:45:09:860-0700"
    //     }, fieldsToReturn).then((jrnls: JournalEntry[]) => {
    //         console.log("New DOCV Journal Entries len: " + jrnls.length);
    //         return jrnls;
    //     });
    // }
    /**
     * Find DocV corresponding journal entry
     */
    function findDocVJournalEntry(console, docv, fieldsToReturn) {
        return Workfront.api.search("JRNLE", {
            aux2: docv.ID,
            subObjCode: "DOCU",
            subObjID: docv.document.ID,
        }, fieldsToReturn).then((jrnls) => {
            console.log("DOCV Journal Entries len: " + jrnls.length);
            if (jrnls.length) {
                return jrnls[0];
            }
            return null;
        });
    }
    Workfront.findDocVJournalEntry = findDocVJournalEntry;
    /**
     */
    function uploadPdfDocumentAsUser(console, fromEmail, parentRef, buffer, fileName, docFolder, docFieldsToReturn) {
        return execAsUser(console, fromEmail, (api, login) => {
            return api.upload(buffer, { filename: fileName, contentType: "application/pdf" }).then((upload) => {
                console.log("Uploaded PDF! Handle: " + upload.handle + ", as user: " + fromEmail.address + ", sessionId: " + login.sessionID + ", into document folder: " + docFolder);
                // Now create a document object for that uploaded PDF
                console.log("Creating document for PDF!");
                return api.create("DOCU", (() => {
                    let params = {
                        name: fileName,
                        docObjCode: parentRef.objCode,
                        objID: parentRef.ID,
                        handle: upload.handle
                        // currentVersion: {
                        //     version: "1.0",
                        //     fileName: att.fileName
                        // }
                    };
                    if (docFolder) {
                        params.folderIDs = [docFolder.ID];
                    }
                    return params;
                })(), docFieldsToReturn).then((htmlDoc) => {
                    console.log("Created doc for PDF: " + htmlDoc.name + ", as user: " + fromEmail.address + ", sessionId: " + login.sessionID);
                    return htmlDoc;
                }).catch((error) => {
                    return Promise.reject(error);
                });
            }).catch((error) => {
                return Promise.reject(error);
            });
        });
    }
    Workfront.uploadPdfDocumentAsUser = uploadPdfDocumentAsUser;
    /**
     * Download a document under a provided user
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param ownerUsername - document is downloaded with this user session
     * @param downloadUrl - a document Url
     * @param output - a writeable stream to save the document
     * @returns {Promise<void>|Promise}
     */
    function download(console, ownerUsername, downloadURL, output) {
        console.log(`*** Downloading document as Owner. Username: ${ownerUsername}, download url: ${downloadURL}"`);
        return execAsUser(console, { address: ownerUsername }, (api, login) => {
            // download
            return api.download(downloadURL, output);
        });
    }
    Workfront.download = download;
    /**
     */
    // export function fetchNewDocuments(console: Logger, fieldsToReturn?: string|string[]): Promise<Document[]> {
    //     return Workfront.api.search<Document[]>("DOCU", {
    //         extRefID_Mod: "isnull",
    //         isDir: false,
    //         lastUpdateDate: "2016-08-18T00:00:00",
    //         lastUpdateDate_Mod: "gte",
    //         lastUpdateDate_Sort: "desc", // Newest first - http://stackoverflow.com/questions/28313311/attask-api-order-by-date
    //         userID: "5713e0c5000f8edaa77bbdf03aa9886e" // TESTING
    //         // entryDate: "$$TODAY-1d",
    //         // entryDate_Range: "$$TODAY",
    //         // entryDate_Mod: "between",  // just for testing. entryDate=$$TODAY-7d&entryDate_Range=$$TODAY&entryDate_Mod=between... . Entry date looks like: "entryDate":"2016-08-16T19:45:09:860-0700"
    //     }, fieldsToReturn).then((docs: Document[]) => {
    //         console.log("Docs len: " + docs.length);
    //         return docs;
    //     });
    // }
})(Workfront || (Workfront = {}));