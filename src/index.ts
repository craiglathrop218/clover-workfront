// http://workfront.github.io/workfront-api/Workfront.Api.html
import * as fs from "fs";
import * as deepExtend from "deep-extend";
import * as FormData from "form-data";
import * as api from "workfront-api";
import * as queryString from "querystring";
import * as moment from "moment";
import * as followRedirects from "follow-redirects";
import {IncomingMessage} from "http";
import {EmailAddress, Attachment} from "mailparser";
import {Api, LoginResult} from "workfront-api";
import {TimedOut} from "./timed-out";
import {WfModel} from "./model";

/**
 * Workfront API connection settings
 */
export let apiFactoryConfig = {
    url: "https://idt.my.workfront.com", // LIVE
    //url: "https://idt.attasksandbox.com/" // TEST
    //version: "4.0"
    version: "5.0"
    //version: "internal"
};
var ApiFactory = api.ApiFactory;
var ApiConstants = api.ApiConstants;
var instance: Api = ApiFactory.getInstance(apiFactoryConfig);
instance.httpParams.apiKey = "d0tz5bgzlif3fpdpap46lvqe9s727jfe"; // LIVE key
//instance.httpParams.apiKey = "2y1o1oc6p8umthza4z25bncdbixy54w2"; // TEST key
const HTTP_REQ_TIMEOUT: number = 30000; // Time in milliseconds to wait for connect event on socket and also time to wait on inactive socket.

// used to store entity metadata responses
let metaDataCache: any = {};

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
        let params: any = { username: username};
        if (password) {
            params.password = password;
        }
        if (this.httpParams.apiKey) {
            params.apiKey = this.httpParams.apiKey;
        }
        return params;
    })(), null, api.Api.Methods.POST).then(function (data: any) {
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
api.Api.prototype.upload = function(stream: fs.ReadStream|Buffer, overrides?: {filename: string, contentType: string}): Promise<any> {
    var form = new FormData();
    form.append('uploadedFile', stream, overrides);

    var options: any = {
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

    return new Promise<any>(function (resolve: any, reject: any) {
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
api.Api.prototype._handleResponse = (resolve: any, reject: any) => {
    return function (response: IncomingMessage) {
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
            } catch (e) {
                reject(body);
                return;
            }
            if (data.error) {
                reject(data);
            } else if (response.statusCode != 200) { // If Workfront is down, then workfront http proxy returns 501 but with no content - so we want to catch that in here
                reject(data);
            } else {
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
api.Api.prototype.share = async function(objCode: string, objId: string, userId: string, coreAction: string) {
    let params: any = {
        accessorID: userId,
        accessorObjCode: "USER",
        coreAction: coreAction
    };
    if (this.httpParams.apiKey) {
        params.apiKey = this.httpParams.apiKey;
    }
    let endpoint = objCode + '/' + objId + '/share';
    let res = await this.request(endpoint, params, [], api.Api.Methods.PUT);
    return res;
};

/**
 * Retrieves metatada for an entity
 *
 * @param objCode The object code we want metadata for
 * @returns {Promise<MetaData>}
 */
api.Api.prototype.metadata = function(objCode: string, useCache?: boolean): Promise<Workfront.MetaData> {
    if (useCache && metaDataCache[objCode]) {
        // console.log(`Metadata from cache! ${objCode}`);
        return Promise.resolve(metaDataCache[objCode]);
    }
    let params: any = {};
    if (this.httpParams.apiKey) {
        params.apiKey = this.httpParams.apiKey;
    }
    let endpoint = objCode + "/metadata";
    // console.log(`Metadata from network! ${objCode}`);
    return this.request(endpoint, params, [], api.Api.Methods.GET).then((metaData: Workfront.MetaData) => {
        metaDataCache[objCode] = metaData;
        return metaData;
    });
};

var requestHasData = function(method: string) {
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
api.Api.prototype.download = function(downloadURL: string, output: NodeJS.WritableStream): Promise<void> {
    var options: any = {
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

    return new Promise<any>((resolve, reject) => {
        console.log("Making a download request: " + JSON.stringify(options) + ", session ID: " + this.httpOptions.headers.sessionID);
        var request = httpTransport.request(options, (response: IncomingMessage) => {
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
api.Api.prototype.request = function(path: string, params: any, fields: string[], method: string) {
    fields = fields || [];
    if (typeof fields === 'string') {
        fields = [fields];
    }

    params = params || {};
    deepExtend(params, this.httpParams);

    var options: any = {},
        alwaysUseGet = this.httpOptions.alwaysUseGet;

    deepExtend(options, this.httpOptions);
    if (alwaysUseGet) {
        params.method = method;
    } else {
        options.method = method;
    }

    if (path.indexOf('/') === 0) {
        options.path = this.httpOptions.path + path;
    } else {
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

    return new Promise(function (resolve: any, reject: any) {
        var request = httpTransport.request(options, this._handleResponse(resolve, reject));
        TimedOut.applyToRequest(request, HTTP_REQ_TIMEOUT);
        request.on('error', reject);
        if (!alwaysUseGet && params && requestHasData(options.method)) {
            request.write(params);
        }
        request.end();
    }.bind(this));
};

interface UserNames {
    firstName: string,
    lastName: string
}

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
function parseEmailNames(addr: EmailAddress): UserNames {
    let result: UserNames = <UserNames>{};
    if (addr.name && addr.name.trim()) {
        // There is a name part in an email address, like "Jaanek Oja <jaanekoja@gmail.com>"
        if (addr.name.indexOf(",") > 0) {
            // Microsoft Outlook tends to put a , between the names and puts the last name first. We will look for that configuration first.
            let sep = addr.name.indexOf(",");
            result.lastName = addr.name.substr(0, sep).trim();
            result.firstName = addr.name.substr(sep + 1).trim();
        } else if (addr.name.indexOf(" ") > 0) {
            // Gmail and others
            let sep = addr.name.indexOf(" ");
            result.firstName = addr.name.substr(0, sep).trim();
            result.lastName = addr.name.substr(sep + 1).trim();
        } else {
            result.firstName = addr.name;
            result.lastName = "";
        }
    } else {
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
export namespace Workfront {
    // export the general API
    export var api: Api = instance;

    /**
     * Defines user access object
     */
    export interface UserAccessConfig {
        accessLevelID: string,
        companyID: string,
        homeGroupID: string
    }

    export interface FetchSsoId extends Function {
        (email: string): Promise<string>
    }

    /**
     * A logger interface for this project.
     */
    export interface Logger {
        log(msg: string): string;
    }

    /**
     * A context object for workfront calls
     */
    export interface WfContext extends Logger {
        /**
         * Check if we have an existing workfront login session for provided user login email / username
         *
         * @param email - user login email / username
         */
        getSession(email: string): LoginResult;

        /**
         * Set existing user session for user login email / username
         *
         * @param email - user login email / username
         * @param login session
         */
        setSession(email: string, login: LoginResult): void;

        /**
         * Return all the login sessions
         */
        getSessions(): Map<string, LoginResult>;
    }

    export interface UploadHandle {handle: string};
    export interface Upload {attachments: Attachment[], handles: UploadHandle[]};

    // Define Workfront API related types in here fop convenient use in other parts of our project
    export import WfError = WfModel.WfError;
    export import WfObject = WfModel.WfObject;
    export import Project = WfModel.Project;
    export import User = WfModel.User;
    export import Document = WfModel.Document;
    export import DocumentVersion = WfModel.DocumentVersion;
    export import DocumentFolder = WfModel.DocumentFolder;
    export import DocumentFolderParentField = WfModel.DocumentFolderParentField;
    export import AssignUserToken = WfModel.AssignUserToken;
    export import CompleteUserRegistration = WfModel.CompleteUserRegistration;
    export import Note = WfModel.Note;
    export import JournalEntry = WfModel.JournalEntry;
    export import NoteTag = WfModel.NoteTag;
    export import Team = WfModel.Team;
    export import TeamMember = WfModel.TeamMember;
    export import Issue = WfModel.Issue;
    export import ReplyMessage = WfModel.ReplyMessage;
    export import IssueUpdate = WfModel.IssueUpdate;
    export import Task = WfModel.Task;
    export import Milestone = WfModel.Milestone;
    export import MilestonePath = WfModel.MilestonePath;
    export import AccessRule = WfModel.AccessRule;
    export import MetaData = WfModel.MetaData;
    export import QueryCount = WfModel.QueryCount;

    export import ObjectCategory = WfModel.ObjectCategory;
    export import Category = WfModel.Category;
    export import CategoryParameter = WfModel.CategoryParameter;
    export import Parameter = WfModel.Parameter;
    export import ParameterOption = WfModel.ParameterOption;
    export import ParameterGroup = WfModel.ParameterGroup;
    export import Group = WfModel.Group;
    export import CustomEnum = WfModel.CustomEnum;

    export interface WfConnError {
        active: boolean,
        errorDate: moment.Moment
    }

    // constants
    export const API_DATE_FORMAT = "YYYY-MM-DD'T'HH:mm:ss:SSSZ"; // Date format in API requests: 2016-08-30T03:52:05:383-0700
    export const DOCV_PROCESSED_MARK = "CLOVER-VER:".toUpperCase();


    /**
     * Login as a user with specified login email
     *
     * @param fromEmail - user login email
     * @returns {Promise<LoginResult>}
     */
    export function login(fromEmail: EmailAddress, waitDelay?: number): Promise<LoginResult> {
        // NB! existing api instance (Workfront.api) is not safe to use while just replacing a sessionId over there
        // For that reason, we create a new instance of api
        let api: Api = ApiFactory.getInstance(apiFactoryConfig, true);
        api.httpParams.apiKey = instance.httpParams.apiKey;

        // if there is wait delay specified after a login
        if (waitDelay) {
            return new Promise<LoginResult>((resolve, reject) => {
                api.login(fromEmail.address).then((login: LoginResult) => {
                    console.log(`Login delay: ${waitDelay}`);
                    setTimeout(() => {
                        resolve(login);
                    }, waitDelay);
                }).catch((error) => {
                    reject(error);
                });
            });
        } else {
            return api.login(fromEmail.address);
        }
    }

    /**
     * Login as a user with specified login email
     *
     * @param fromEmail - user login email
     * @returns {Promise<LoginResult>}
     */
    export function logout(login: LoginResult): Promise<Object> {
        // NB! existing api instance (Workfront.api) is not safe to use while just replacing a sessionId over there
        // For that reason, we create a new instance of api
        let api: Api = ApiFactory.getInstance(apiFactoryConfig, true);
        delete api.httpParams.apiKey; // This needs to be here, otherwise entity is created under apiKey user
        api.httpOptions.headers.sessionID = login.sessionID;
        return api.logout();
    }

    function execAsUserWithSession<T>(console: Logger, fromEmail: EmailAddress, callback: (api: Api, login: LoginResult) => Promise<T>, login: LoginResult): Promise<T> {
        console.log("*** Executing as User (with existing login session). Email: " + fromEmail.address + ", login session: " + JSON.stringify(login));

        // NB! existing api instance (Workfront.api) is not safe to use while just replacing a sessionId over there
        // For that reason, we create a new instance of api
        let api: Api = ApiFactory.getInstance(apiFactoryConfig, true);
        delete api.httpParams.apiKey; // This needs to be here, otherwise entity is created under apiKey user
        api.httpOptions.headers.sessionID = login.sessionID;

        // login and execute provided function under a user
        let updated = new Promise<T>((resolve, reject) => {
            callback(api, login).then((result: T) => {
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
    export function execAsUser<T>(console: Logger, fromEmail: EmailAddress, callback: (api: Api, login: LoginResult) => Promise<T>): Promise<T> {
        // check if we have WfContext coming in, if so then if not already logged in then login
        if (console.getSession && console.setSession) {
            let ctx: WfContext = <WfContext> console;
            let login: LoginResult = ctx.getSession(fromEmail.address);
            if (!login) {
                // login first
                console.log(`*** No login session found for user email: ${fromEmail.address}. Getting a new session.`);
                return Workfront.login(fromEmail, 5000).then((login: LoginResult) => {
                    console.log("Got login session for user: " + fromEmail.address + ", user id: " + login.userID + ", sessionId: " + login.sessionID);
                    ctx.setSession(fromEmail.address, login);
                    return execAsUserWithSession<T>(console, fromEmail, callback, login);
                });
            } else {
                console.log(`Existing login session found for user email: ${fromEmail.address}, user id: ${login.userID}, sessionId: ${login.sessionID}`);
                return execAsUserWithSession<T>(console, fromEmail, callback, login);
            }
        } else {
            console.log("*** Executing as User (with logging in first). Email: " + fromEmail.address);

            // NB! existing api instance (Workfront.api) is not safe to use while just replacing a sessionId over there
            // For that reason, we create a new instance of api
            let api: Api = ApiFactory.getInstance(apiFactoryConfig, true);
            api.httpParams.apiKey = instance.httpParams.apiKey;

            // login and execute provided function under a user
            let updated = new Promise<T>((resolve, reject) => {
                api.login(fromEmail.address).then((login: LoginResult) => {
                    delete api.httpParams.apiKey; // This needs to be here, otherwise entity is created under apiKey user
                    let userId = login.userID;
                    let sessionId = login.sessionID;
                    console.log("Got login session for user: " + fromEmail.address + ", user id: " + userId + ", sessionId: " + sessionId);

                    return callback(api, login).then((result: T) => {
                        console.log("Execute as user finished, result: " + JSON.stringify(result));
                        return result;
                    });
                }).then((result: T) => {
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

    /**
     * Fetches a project from Workfront based on provided project id.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param projId - project id to fetch
     * @param fields - extra fields to return for the project
     * @returns {Promise<Project>} - fetched project
     */
    export function getProjectById(console: Logger, projId: string, fields?: string|string[]): Promise<Project> {
        console.log("Getting Project by id: " + projId);
        return Workfront.api.get<Project>("PROJ", projId, fields).then((project: Project) => {
            return project;
        });
    }

    /**
     * Searches for a project from Workfront based on provided project reference nr.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param refNr - project reference nr.
     * @returns {Promise<Project>} - a project if found, otherwise null
     */
    export function getProjectByRefNr(console: Logger, refNr: string): Promise<Project> {
        return Workfront.api.search<Project[]>("PROJ", {
            referenceNumber: refNr,
            referenceNumber_Mod: "eq"
        }, ["referenceNumber"]).then((projects: Project[]) => {
            if (projects.length) {
                return projects[0];
            } else {
                return null;
            }
        });
    }

    /**
     * Upload provided attachments to the Workfront server.
     * 
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param attachments - attachments to upload
     * @returns {Promise<Upload>|Promise} - an object containing provided attachments and Workfront reference handles to them 
     */
    export function uploadMailAttachmentsAsUser(console: Logger, fromEmail: EmailAddress, attachments: Attachment[]): Promise<Upload> {
        console.log(`Uploading mail attachments as user ${fromEmail.address}, attachments: ${attachments}!`);
        if (attachments && attachments.length) {
            return execAsUser<Upload>(console, fromEmail, (api: Api, login: LoginResult) => {
                let allUploads = new Array<Promise<any>>();
                for (let att of attachments) {
                    let data: Buffer = att.content;
                    //console.log("Content object type: " + data.constructor);
                    allUploads.push(api.upload(data, {filename: att.fileName, contentType: att.contentType}));
                }
                return Promise.all(allUploads).then((data: UploadHandle[]) => {
                    console.log("Attachments uploaded!");
                    return <Upload>{attachments: attachments, handles: data};
                });
            });
        } else {
            console.log("Email has no attachments!");
            return Promise.resolve();
        }
    }

    /**
     * Fetches an existing user from Workfront based on provided email address or if not found then creates a new user.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param fromEmail - an email address of a user that sent the email
     * @param accessConfigs - the workfront access settings / levels for a user
     * @returns {Promise<User>|Promise}
     */
    export function getOrCreateUser(console: Logger, fromEmail: EmailAddress, accessConfigs: {externalUsers: UserAccessConfig, idtUsers: UserAccessConfig}, fetchSsoId?: FetchSsoId): Promise<User> {
        let isIDTEmployee = fromEmail.address.indexOf("@idt.com") > 0 ? true : false;

        // Set user access levels/settings if new user needs to be created 
        let accessConfig: UserAccessConfig = {
            accessLevelID: accessConfigs.externalUsers.accessLevelID,
            companyID: accessConfigs.externalUsers.companyID,
            homeGroupID: accessConfigs.externalUsers.homeGroupID
        }
        if (isIDTEmployee) {
            // User has an @idt.com address. IDT company code and proper access level
            accessConfig.accessLevelID = accessConfigs.idtUsers.accessLevelID;
            accessConfig.companyID = accessConfigs.idtUsers.companyID;
            accessConfig.homeGroupID = accessConfigs.idtUsers.homeGroupID;
        }
        let queryFields = ["emailAddr", "firstName", "lastName"]; // additional fields to return
        let userDone = new Promise<User>((resolve: (user: User) => void, reject: (error: any) => void) => {
            // First, check if that user already exists
            Workfront.api.search<User[]>("USER", {
                emailAddr: fromEmail.address,
                emailAddr_Mod: "cieq"
            }, queryFields).then(async (users: User[]) => {
                console.log(`getOrCreateUser. Got users: ${users}`);
                if (users && users.length > 1) {
                    return Promise.reject("Multiple users returned for an email: " + fromEmail.address);
                }
                if (users && users.length) {
                    // we have found an existing user
                    console.log("*** User found by email: " + fromEmail.address);
                    return users[0];
                } else {
                    // user not found
                    console.log("*** User not found by email: " + fromEmail.address);
                    
                    // check if we need to get ssoId
                    let ssoId: string = null;
                    if (fetchSsoId && isIDTEmployee) {
                        ssoId = await fetchSsoId(fromEmail.address);
                        console.log(`*** IDT Employee. User sso id: ${ssoId}`);
                    }

                    // Create a new user
                    let userNames = parseEmailNames(fromEmail);
                    return Workfront.api.create<User>("USER", (() => {
                        let params: any = {
                            firstName: userNames.firstName,
                            lastName: userNames.lastName,
                            emailAddr: fromEmail.address,
                            accessLevelID: accessConfig.accessLevelID,
                            companyID: accessConfig.companyID,
                            homeGroupID: accessConfig.homeGroupID
                        }
                        if (ssoId) {
                            params.ssoUsername = ssoId;
                        }
                        return params;
                    })(), queryFields).then((user: User) => {
                        // User created
                        console.log("*** User created! User: " + JSON.stringify(user));
                        if (!user.ID) {
                            return Promise.reject("Something went wrong while creating a new user! User ID is not defined! Result: " + JSON.stringify(user));
                        }

                        // If we have an external user to IDT then we must assign a username and password for that user
                        if (isIDTEmployee == false) {
                            console.log("*** Assigning a token to the user!");
                            // First, get a token for the registration process
                            return Workfront.api.execute("USER", user.ID, 'assignUserToken').then((token: AssignUserToken) => {
                                console.log(`Got token for new user! Token: ${JSON.stringify(token)}`);
                                return Promise.resolve(token);
                            }).then((token: AssignUserToken) => {
                                console.log("*** Generate password!");
                                // now that we have a token, finish the registration
                                user.password = randomPassword();

                                // For unknown reasons you need to send the first and last name in again when completing the user reg. Just an AtTask thing.
                                return Workfront.api.execute("USER", user.ID, 'completeUserRegistration', {
                                    firstName: userNames.firstName,
                                    lastName: userNames.lastName,
                                    token: token.result, // token hash is stored inside ".result" property
                                    title: "",
                                    newPassword: user.password
                                });
                            }).then((data: CompleteUserRegistration) => {
                                // For some reason when this works it only returns null ({"result":null}). I swear it wasn't doing that last week (11/25/14) today.
                                console.log(`User registration complete! Result: ${JSON.stringify(data)}. User ID: ${user.ID}`);
                                return user;
                            }).catch((error) => {
                                return Promise.reject(error);
                            });
                        } else {
                            console.log(`IDT user! User ID: ${user.ID}`);
                            return user;
                        }
                    }).then((user: User) => {
                        return user;
                    }).catch((error) => {
                        return Promise.reject(error);
                    });
                }
            }).then((user: User) => {
                console.log("User: " + JSON.stringify(user));
                resolve(user);
            }).catch(reject);
        });
        return userDone;
    }

    /**
     * For all provided user email addresses create corresponding user objects in Workfront.
     *
     * @returns {Promise<T>|Promise<R>|Promise} - created user objects
     */
    export function getOrCreateUsersByEmail(console: Logger, userEmails: EmailAddress[], emailsToIgnore: string[], otherConfigs: any, fetchSsoId: FetchSsoId): Promise<User[]> {
        console.log(`Get or create users by email! Emails: ${JSON.stringify(userEmails)}`);

        // ignore service mailbox emails
        let ignoreEmails: Set<string> = new Set();
        // add all mail account emails to ignore
        for (let email of emailsToIgnore) {
            ignoreEmails.add(email.toLowerCase());
        }
        ignoreEmails.add("webmaster@idt.com");

        //
        let usersFetched: Array<Promise<User>> = [];
        for (let userEmail of userEmails) {
            // Sometimes distribution lists are copied when submitting a request. We do not want to create them as a user.
            // Some distribution lists start with "corp", and some start with "kk" (for unknown reasons).
            if (userEmail.address.substr(0,2) != "kk" && userEmail.address.substr(0,4) != "corp" && !ignoreEmails.has(userEmail.address.toLowerCase())) {
                usersFetched.push(getOrCreateUser(console, userEmail, otherConfigs.accessConfigs, fetchSsoId));
            }
        }
        return Promise.all(usersFetched).then((users: User[]) => {
            console.log("Users fetched or created! " + JSON.stringify(users));
            return users;
        });
    }

    /**
     * Fetches a user from Workfront based on provided user id.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param userId - user id to fetch
     * @param fields - extra fields to return for user
     * @returns {Promise<User>} - fetched user
     */
    export function getUserById(console: Logger, userId: string, fields?: string|string[]): Promise<User> {
        console.log("Getting User by id: " + userId);
        return Workfront.api.get<User>("USER", userId, fields).then((user: User) => {
            return user;
        });
    }

    /**
     * Fetches a team from Workfront based on provided team id.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param teamId - team id to fetch
     * @param fields - extra fields to return for team
     * @returns {Promise<Team>} - fetched team
     */
    export function getTeamById(console: Logger, teamId: string, fields?: string|string[]): Promise<Team> {
        console.log("Getting Team by id: " + teamId);
        return Workfront.api.get<Team>("TEAMOB", teamId, fields).then((team: Team) => {
            return team;
        });
    }

    /**
     * Fetches an issue from Workfront based on provided issue id.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param issueId - issue id to fetch
     * @param fields - extra fields to return for an issue
     * @returns {Promise<Issue>} - fetched issue
     */
    export function getIssueById(console: Logger, issueId: string, fields?: string|string[]): Promise<Issue> {
        console.log("Getting Issue by id: " + issueId);
        return Workfront.api.get<Issue>("OPTASK", issueId, fields).then((issue: Issue) => {
            return issue;
        });
    }

    /**
     * Searches for an issue from Workfront based on provided external extRefID - email id.
     *
     * If email comes in then an email id is put into a field named "extRefID" on an issue. So we can search later for an existing issue based on that field.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param extRefID - an email id.
     * @returns {Promise<Issue>} - an issue if found based on email id
     */
    export function getIssueByExtId(console: Logger, extRefID: string): Promise<Issue> {
        console.log("Checking issue existence by extRefId: " + extRefID);
        return Workfront.api.search<Issue[]>("OPTASK", {
            extRefID: extRefID,
            extRefID_Mod: "eq"
        }).then((issues: Issue[]) => {
            if (issues && issues.length > 1) {
                return Promise.reject(Error("More than one issue found for message id: " + extRefID));
            } else if (issues.length) {
                return issues[0];
            } else {
                return null;
            }
        });
    }

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
    export function makeUpdatesAsUser(console: Logger, from: EmailAddress, entityRef: WfObject, updates: any, fields = []): Promise<WfObject> {
        return execAsUser<WfObject>(console, from, (api: Api, login: LoginResult) => {
            console.log("[makeUpdateAsUser] - Got login session for user: " + from.address + ", sessionId: " + login.sessionID);
            // update
            return api.edit<WfObject>(entityRef.objCode, entityRef.ID, updates, fields).then((updatedObj: WfObject) => {
                console.log(`[makeUpdateAsUser] ${entityRef.objCode}, ID: ${entityRef.ID}, updates: ${JSON.stringify(updatedObj)}`);
                return updatedObj;
            });
        });
    }

    /**
     * Searches for an issue from Workfront based on provided issue reference nr.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param refNr - issue reference nr. Got from an email body
     * @returns {Promise<Issue>} - an issue if found, otherwise null
     */
    export function getIssueByRefNr(console: Logger, refNr: string): Promise<Issue> {
        return Workfront.api.search<Issue[]>("OPTASK", {
            referenceNumber: refNr,
            referenceNumber_Mod: "eq"
        }, ["referenceNumber"]).then((issues: Issue[]) => {
            if (issues.length) {
                return issues[0];
            } else {
                return null;
            }
        });
    }

    /**
     * Creates a new Issue with provided fields.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param params - fields to be set on an issue
     * @returns {Promise<Issue>} - created Issue
     */
    export function createIssueAsUser(console: Logger, fromEmail: EmailAddress, params: Object): Promise<Issue> {
        console.log("*** Creating issue! Params: " + JSON.stringify(params));
        return execAsUser<Issue>(console, fromEmail, (api: Api) => {
            return api.create<Issue>("OPTASK", params);
        });
    }

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
    export function updateIssueAsUser(console: Logger, fromEmail: EmailAddress, issueId: string, updates: Object, fields?: string|string[]): Promise<Issue> {
        console.log("*** Updating issue as User. Email: " + fromEmail.address + ", updates: " + JSON.stringify(updates));
        return execAsUser<Issue>(console, fromEmail, (api: Api, login: LoginResult) => {
            // update
            return api.edit("OPTASK", issueId, updates, fields).then((issue: Issue) => {
                console.log("Issue updated: " + JSON.stringify(issue));
                return issue;
            });
        });
    }

    /**
     * Creates a new Document Folder under a parent with provided fields.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param params - fields to be set on an issue
     * @returns {Promise<DocumentFolder>} - created Document Folder
     */
    export function createFolderAsUser(console: Logger, fromEmail: EmailAddress, params: Object, fields?: string|string[]): Promise<DocumentFolder> {
        console.log("*** Creating document folder! Params: " + JSON.stringify(params));
        return execAsUser<DocumentFolder>(console, fromEmail, (api: Api) => {
            return api.create<DocumentFolder>("DOCFDR", params, fields);
        });
    }

    /**
     * Searches for a task based on task ref nr.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param refNr - a reference number got from email body
     * @returns {Promise<Task>} - a task if found, otherwise null
     */
    export function getOrCreateDocumentFolder(console: Logger, fromEmail: EmailAddress, folderParentField: DocumentFolderParentField, folderName: string, fields?: string|string[], parentFolderId?: string): Promise<DocumentFolder> {
        if (!folderParentField) {
            return Promise.reject(`Document folder parent entity field name (issueID, taskID, projectID) is required to create a folder! Requested folder name: ${folderName}`);
        }
        console.log(`*** Searching document folder! Folder name: ${folderName}, entity field: ${JSON.stringify(folderParentField)}, parent folder id: ${parentFolderId}`);
        
        return Workfront.api.search<DocumentFolder[]>("DOCFDR", (() => {
            let params: any = {
                name: folderName,
                name_Mod: "cieq"
            }
            params[folderParentField.name] = folderParentField.value;
            if (parentFolderId) {
                params.parentID = parentFolderId;
            }
            return params;
        })(), fields).then((docFolders: DocumentFolder[]) => {
            if (docFolders.length) {
                let docFolder: DocumentFolder = docFolders[0];
                docFolder.folderParentField = folderParentField;
                return docFolder;
            } else {
                return createFolderAsUser(console, fromEmail, (() => {
                    let params: any = {
                        name: folderName
                    }
                    params[folderParentField.name] = folderParentField.value;
                    if (parentFolderId) {
                        params.parentID = parentFolderId;
                    }
                    return params;
                })(), fields).then((docFolder: DocumentFolder) => {
                    docFolder.folderParentField = folderParentField;
                    return docFolder;
                });
            }
        });
    }

    /**
     * Creates new documents from uploaded entities and sets a reference to provided parent entity - issue for example. 
     * 
     * @param console - logger object (for later debugging in case of errors happen in processing) 
     * @param parentRef - reference to entity the created docuements are related to
     * @param upload - references to upload entities
     * @returns {Promise<Document[]>|Promise} - created documents
     */
    export function createDocumentsAsUser(console: Logger, fromEmail: EmailAddress, parentRef: WfObject, upload: Upload, docFieldsToReturn: string[], docFolder?: DocumentFolder): Promise<Document[]> {
        return execAsUser<Document[]>(console, fromEmail, (api: Api, login: LoginResult) => {
            let allPromises = new Array<Promise<Document>>();
            for (let i=0; i < upload.attachments.length; i++) {
                let att: Attachment = upload.attachments[i];
                let handle: UploadHandle = upload.handles[i];

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
                    let params: Document = {
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
                        params.folderIDs = [docFolder.ID]
                    }
                    return params;
                })(), docFieldsToReturn));
            }
            return Promise.all(allPromises).then((docs: Document[]) => {
                return docs;
            });
        });
    }

    /**
     * Fetches a document from Workfront based on provided document id.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param docId - document id to fetch
     * @param fields - extra fields to return for a document
     * @returns {Promise<Document>} - fetched document
     */
    export function getDocumentById(console: Logger, docId: string, fields?: string|string[]): Promise<Document> {
        console.log("Getting Document by id: " + docId);
        return Workfront.api.get<Document>("DOCU", docId, fields).then((doc: Document) => {
            return doc;
        });
    }

    /**
     * Fetches a document version from Workfront based on provided document version id.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param docVerId - document version id to fetch
     * @param fields - extra fields to return for a document version
     * @returns {Promise<DocumentVersion>} - fetched document version
     */
    export function getDocumentVersionById(console: Logger, docVerId: string, fields?: string|string[]): Promise<DocumentVersion> {
        console.log("Getting Document Version by id: " + docVerId + ", fields to return: " + JSON.stringify(fields));
        return Workfront.api.get<DocumentVersion>("DOCV", docVerId, fields).then((docVer: DocumentVersion) => {
            return docVer;
        });
    }

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
    export function createNoteAsUser(console: Logger, user: EmailAddress, params: Note): Promise<Note> {
        console.log("*** Creating Note with User email: " + user.address + ", params: " + JSON.stringify(params));
        return execAsUser<Note>(console, user, (api: Api, login: LoginResult) => {
            let userId = login.userID;
            // create a note
            let fieldsToReturn = ["ownerID"];
            params.ownerID = userId;
            return api.create("NOTE", params, fieldsToReturn).then((note: Note) => {
                //console.log("Note created: " + JSON.stringify(note));
                return note;
            });
        });
    }

    /**
     * Create a reply note as a user with provided email.  
     * 
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param fromEmail - create a new reply note as a user with this provided email
     * @param reply - a reply object containing target entity and reply message
     * @returns {Promise<Note>|Promise} - a new reply Note object that was created
     */
    export function createReplyNoteAsUser(console: Logger, fromEmail: EmailAddress, reply: ReplyMessage, replyToEntityRef: Workfront.WfObject): Promise<Note> {
        console.log("*** Creating Reply Note with User email: " + fromEmail.address + ", note update: " + JSON.stringify(reply));
        return execAsUser<Note>(console, fromEmail, (api: Api, login: LoginResult): Promise<Note> => {
            console.log(`Starting to create reply note! From: ${JSON.stringify(fromEmail)}, login: ${JSON.stringify(login)}, reply to entity ref: ${JSON.stringify(replyToEntityRef)}, reply note: ${JSON.stringify(reply)}`);
            let userId = login.userID;
            // create a note
            let params: Note = <Note>{};
            switch(replyToEntityRef.objCode){
                case "OPTASK": { // Issue
                    params.opTaskID = replyToEntityRef.ID;
                    break;
                }
                case "PROJ": { // Project
                    params.projectID = replyToEntityRef.ID;
                    break;
                }
                case "TASK": { // Task
                    params.taskID = replyToEntityRef.ID;
                    break;
                }
                case "PORT": {// Portfolio
                    params.portfolioID = replyToEntityRef.ID;
                    break;
                }
                case "PRGM": {// Program
                    params.programID = replyToEntityRef.ID;
                    break;
                }
                case "DOCU": {// Document
                    params.documentID = replyToEntityRef.ID;
                    break;
                }
                case "TMPL": {// Template
                    params.templateID = replyToEntityRef.ID;
                    break;
                }
                case "TTSK": {// Template Task
                    params.templateTaskID = replyToEntityRef.ID;
                    break;
                }
                default: {
                    return Promise.reject(`!!!!ERROR!!!! An unrecognized object type ${replyToEntityRef.objCode} was just entered.`);
                }
            }
            if (reply.parentJournalEntryID){
                params.parentJournalEntryID = reply.parentJournalEntryID;
            }
            params.noteObjCode = replyToEntityRef.objCode;
            params.objID = replyToEntityRef.ID;
            params.noteText = reply.textMsg.trim();
            if (reply.threadID){
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
            return api.create("NOTE", params).then((note: Note) => {
                console.log(`Note created to ${params.noteObjCode}:${params.objID}: ${reply.textMsg.substring(0, 50)}...`);
                return note;
            });
        });
    }

    /**
     * Fetches the Note object from Workfront based on provided note id. 
     * 
     * @param console - logger object (for later debugging in case of errors happen in processing) 
     * @param noteId - note id
     * @param fields - extra fields to return
     * @returns {Promise<Note>} - Note object corresponding to provided note id
     */
    export function getNoteById(console: Logger, noteId: string, fields?: string|string[]): Promise<Note> {
        console.log("Getting Note by id: " + noteId);
        return Workfront.api.get<Note>("NOTE", noteId, fields).then((note: Note) => {
            return note;
        });
    }

    /**
     * Fetches the Note object from Workfront based on referenced journal entry id.  
     * 
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param journalEntryId - journal entry id
     * @param fields - extra fields to return 
     * @returns {Promise<Note>} - Note object corresponding to provided note id
     */
    export function getJournalEntryById(console: Logger, journalEntryId: string, fields?: string|string[]): Promise<JournalEntry> {
        console.log("Getting Journal Entry by id: " + journalEntryId);
        return Workfront.api.get<JournalEntry>("JRNLE", journalEntryId, fields).then((jrnle: JournalEntry) => {
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

    /**
     * Searches for a task based on task ref nr.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param refNr - a reference number got from email body
     * @returns {Promise<Task>} - a task if found, otherwise null
     */
    export function getTaskByRefNr(console: Logger, refNr: string): Promise<Task> {
        return Workfront.api.search<Issue[]>("TASK", {
            referenceNumber: refNr,
            referenceNumber_Mod: "eq"
        }, ["referenceNumber"]).then((tasks: Task[]) => {
            if (tasks.length) {
                return tasks[0];
            } else {
                return null;
            }
        });
    }

    /**
     * Update existing task as a user with provided email. 
     * 
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param fromEmail - update task as a user with this email
     * @param taskId - task id to update
     * @param updates - update fields on task
     * @returns {Promise<Task>|Promise} - update task
     */
    export function updateTaskAsUser(console: Logger, fromEmail: EmailAddress, taskId: string, updates: Object): Promise<Task> {
        console.log("*** Updating task as User. Email: " + fromEmail.address + ", updates: " + JSON.stringify(updates));
        return execAsUser<Task>(console, fromEmail, (api: Api, login: LoginResult) => {
            // update
            return api.edit("TASK", taskId, updates).then((task: Task) => {
                console.log("Task updated: " + JSON.stringify(task));
                return task;
            });
        });
    }

    /**
     * Query for team members
     */
    export function getTeamMembers(console: Logger, teamId: string): Promise<TeamMember[]> {
        let fieldsToReturn = ["ID", "name", "teamMembers:*"];
        return Workfront.api.get<Issue>("TEAMOB", teamId, fieldsToReturn).then((team: Team) => {
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
    export function findDocVJournalEntry(console: Logger, docv: DocumentVersion, fieldsToReturn?: string|string[]): Promise<JournalEntry> {
        return Workfront.api.search<JournalEntry[]>("JRNLE", {
            aux2: docv.ID, // DocV id will be put in "aux - Additional info field" when journal entry is created
            subObjCode: "DOCU",
            subObjID: docv.document.ID,
        }, fieldsToReturn).then((jrnls: JournalEntry[]) => {
            console.log("DOCV Journal Entries len: " + jrnls.length);
            if (jrnls.length) {
                return jrnls[0];
            }
            return null;
        });
    }

    /**
     */
    export function uploadPdfDocumentAsUser(console: Logger, fromEmail: EmailAddress, parentRef: WfObject, buffer: Buffer | string, fileName: string, docFolder: Workfront.DocumentFolder, docFieldsToReturn: string[]): Promise<Document> {
        return execAsUser<Document>(console, fromEmail, (api: Api, login: LoginResult) => {
            return api.upload(buffer, {filename: fileName, contentType: "application/pdf"}).then((upload: Workfront.UploadHandle) => {
                console.log("Uploaded PDF! Handle: " + upload.handle + ", as user: " + fromEmail.address + ", sessionId: " + login.sessionID + ", into document folder: " + docFolder);
                // Now create a document object for that uploaded PDF
                console.log("Creating document for PDF!");
                return api.create("DOCU", (() => {
                    let params: Document = {
                        name: fileName,
                        docObjCode: parentRef.objCode,
                        objID: parentRef.ID,
                        handle: upload.handle
                        // currentVersion: {
                        //     version: "1.0",
                        //     fileName: att.fileName
                        // }
                    }
                    if (docFolder) {
                        params.folderIDs = [docFolder.ID]
                    }
                    return params;
                })(), docFieldsToReturn).then((htmlDoc: Workfront.Document) => {
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

    /**
     * Download a document under a provided user
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param ownerUsername - document is downloaded with this user session
     * @param downloadUrl - a document Url
     * @param output - a writeable stream to save the document 
     * @returns {Promise<void>|Promise}
     */
    export function download(console: Logger, ownerUsername: string, downloadURL: string, output: NodeJS.WritableStream): Promise<void> {
        console.log(`*** Downloading document as Owner. Username: ${ownerUsername}, download url: ${downloadURL}"`);
        return execAsUser<Document>(console, {address: ownerUsername}, (api: Api, login: LoginResult) => {
            // download
            return api.download(downloadURL, output);
        });
    }

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
}

