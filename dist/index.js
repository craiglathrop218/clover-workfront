"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// http://workfront.github.io/workfront-api/Workfront.Api.html
const api = require("workfront-api");
const model_1 = require("./model");
const api_overrides_1 = require("./api-overrides");
// execute api overrides in start of this module
api_overrides_1.apiOverrides(api.Api);
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
var ApiFactory = api.ApiFactory;
/**
 * A Workfront internal API for our project that provides a convenient and wrapped methods to be used in different usage scenarios.
 */
// implementation
class Workfront {
    initialize(config = Workfront.apiFactoryConfig, key) {
        this.apiFactoryConfig = config;
        this.api = ApiFactory.getInstance(this.apiFactoryConfig);
        this.api.httpParams.apiKey = key;
    }
    setApiKey(key) {
        this.api.httpParams.apiKey = key;
    }
    /**
     * Login as a user with specified login email
     *
     * @param fromEmail - user login email
     * @returns {Promise<LoginResult>}
     */
    login(console, fromEmail, waitDelay) {
        // NB! existing api instance (Workfront.api) is not safe to use while just replacing a sessionId over there
        // For that reason, we create a new instance of api
        let api = ApiFactory.getInstance(this.apiFactoryConfig, true);
        api.httpParams.apiKey = this.api.httpParams.apiKey;
        // if there is wait delay specified after a login
        if (waitDelay) {
            return new Promise((resolve, reject) => {
                api.login(fromEmail.address).then((login) => {
                    console.log(`Logged in! Waiting after login delay: ${waitDelay} before returning ...`);
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
    /**
     * Login as a user with specified login email
     *
     * @param fromEmail - user login email
     * @returns {Promise<LoginResult>}
     */
    logout(login) {
        // NB! existing api instance (Workfront.api) is not safe to use while just replacing a sessionId over there
        // For that reason, we create a new instance of api
        let api = ApiFactory.getInstance(this.apiFactoryConfig, true);
        delete api.httpParams.apiKey; // This needs to be here, otherwise entity is created under apiKey user
        api.httpOptions.headers.sessionID = login.sessionID;
        return api.logout();
    }
    execAsUserWithSession(console, fromEmail, callback, login) {
        let userEmail = fromEmail ? fromEmail.address : "";
        console.log("*** Executing as User (with existing login session). Email: " + userEmail + ", login session: " + JSON.stringify(login));
        // NB! existing api instance (Workfront.api) is not safe to use while just replacing a sessionId over there
        // For that reason, we create a new instance of api
        let api = ApiFactory.getInstance(this.apiFactoryConfig, true);
        delete api.httpParams.apiKey; // This needs to be here, otherwise entity is created under apiKey user
        api.httpOptions.headers.sessionID = login.sessionID;
        // login and execute provided function under a user
        let updated = new Promise((resolve, reject) => {
            callback(api, login).then((result) => {
                console.log("Execute as user finished, result: " + JSON.stringify(result));
                resolve(result);
            }).catch((error) => {
                console.log(error);
                console.log(`Error. User: ${userEmail}, login session: ${JSON.stringify(login)}, error: ${JSON.stringify(error)}`);
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
    async execAsUser(console, fromEmail, callback) {
        // check if we have WfContext coming in, if so then if not already logged in then login
        if (console.getSession && console.setSession) {
            let ctx = console;
            let login = ctx.getSession(fromEmail.address);
            if (!login) {
                // login first
                console.log(`*** No login session found for user email: ${fromEmail.address}. Getting a new session.`);
                let loginCount = 1;
                while (true) {
                    try {
                        console.log(`*** Logging in for user email: ${fromEmail.address}. Login count: ${loginCount}`);
                        let execResult = await this.login(console, fromEmail, 2000).then((login) => {
                            console.log("Got login session for user: " + fromEmail.address + ", user id: " + login.userID + ", sessionId: " + login.sessionID);
                            ctx.setSession(fromEmail.address, login);
                            return this.execAsUserWithSession(console, fromEmail, callback, login);
                        });
                        return Promise.resolve(execResult);
                    }
                    catch (e) {
                        if (e.error && e.error["class"]) {
                            let errorClass = e.error["class"];
                            let errorMsg = e.error.message;
                            if (errorClass == "com.attask.common.AuthenticationException") {
                                console.log(`*** Authentication Exception for user email: ${fromEmail.address}, message: ${errorMsg}`);
                                if (loginCount < 3) {
                                    console.log(`*** Trying to re-login for user email: ${fromEmail.address} ...`);
                                    loginCount++;
                                    continue;
                                }
                                else {
                                    console.log(`*** Giving up to authenticate for user email: ${fromEmail.address}`);
                                }
                            }
                        }
                        return Promise.reject(e);
                    }
                }
            }
            else {
                console.log(`Existing login session found for user email: ${fromEmail.address}, user id: ${login.userID}, sessionId: ${login.sessionID}`);
                return this.execAsUserWithSession(console, fromEmail, callback, login);
            }
        }
        else {
            console.log("*** Executing as User (with logging in first). Email: " + fromEmail.address);
            // NB! existing api instance (Workfront.api) is not safe to use while just replacing a sessionId over there
            // For that reason, we create a new instance of api
            let api = ApiFactory.getInstance(this.apiFactoryConfig, true);
            api.httpParams.apiKey = this.api.httpParams.apiKey;
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
    /**
     * Fetches a project from Workfront based on provided project id.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param projId - project id to fetch
     * @param fields - extra fields to return for the project
     * @returns {Promise<Project>} - fetched project
     */
    getProjectById(console, projId, fields) {
        console.log("Getting Project by id: " + projId);
        return this.api.get("PROJ", projId, fields).then((project) => {
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
    getProjectByRefNr(console, refNr) {
        return this.api.search("PROJ", {
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
    /**
     * Upload provided attachments to the Workfront server.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param attachments - attachments to upload
     * @returns {Promise<Upload>|Promise} - an object containing provided attachments and Workfront reference handles to them
     */
    uploadMailAttachmentsAsUser(console, fromEmail, attachments) {
        console.log(`Uploading mail attachments as user ${fromEmail.address}, attachments: ${attachments}!`);
        if (attachments && attachments.length) {
            return this.execAsUser(console, fromEmail, (api, login) => {
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
            return Promise.resolve(null);
        }
    }
    /**
     * For all provided user email addresses create corresponding user objects in Workfront.
     *
     * @returns {Promise<T>|Promise<R>|Promise} - created user objects
     */
    async getUsersByEmail(console, userEmails, emailsToIgnore, fieldsToReturn) {
        console.log(`Get users by email! Emails: ${JSON.stringify(userEmails)}`);
        // ignore service mailbox emails
        let ignoreEmails = new Set();
        // add all mail account emails to ignore
        for (let email of emailsToIgnore) {
            ignoreEmails.add(email.toLowerCase().trim());
        }
        // fetch users by email
        let userEmailsFetched = [];
        let usersFetched = [];
        for (let userEmail of userEmails) {
            if (!ignoreEmails.has(userEmail.address.toLowerCase().trim())) {
                usersFetched.push(this.getUserByEmail(console, userEmail, fieldsToReturn));
                userEmailsFetched.push(userEmail.address);
            }
        }
        let users = await Promise.all(usersFetched);
        console.log("Users fetched! " + JSON.stringify(users));
        let result = new Map();
        for (let i = 0; i < userEmailsFetched.length; i++) {
            let email = userEmailsFetched[i];
            let user = users[i];
            result.set(email, user);
        }
        return result;
    }
    /**
     * Fetches an existing user from Workfront based on provided email address
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param fromEmail - an email address of a user that sent the email
     * @returns {Promise<User>|Promise}
     */
    async getUserByEmail(console, fromEmail, fieldsToReturn) {
        // First, check if user already exists
        let users = await this.api.search("USER", {
            emailAddr: fromEmail.address,
            emailAddr_Mod: "cieq"
        }, fieldsToReturn);
        console.log(`getUser. Got users: ${users}`);
        if (users && users.length > 1) {
            throw new Error(`Multiple users returned for an email: ${fromEmail.address}`);
        }
        if (users && users.length) {
            // we have found an existing user
            console.log(`*** User found by email: ${fromEmail.address}`);
            return users[0];
        }
        // user not found
        console.log(`*** User not found by email: ${fromEmail.address}`);
        return null;
    }
    /**
     * Fetches an existing user from Workfront based on provided email address or if not found then creates a new user.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param fromEmail - an email address of a user that sent the email
     * @param accessConfigs - the workfront access settings / levels for a user
     * @returns {Promise<User>|Promise}
     */
    async getOrCreateUser(console, fromEmail, accessConfigs, userFieldsToReturn, fetchSsoId) {
        let user = await this.getUserByEmail(console, fromEmail, userFieldsToReturn);
        if (user) {
            // we found existing user, return it
            return user;
        }
        // skip creating idt.com users
        let isIDTEmployee = fromEmail.address.toLowerCase().indexOf("@idt.com") > 0 ? true : false;
        if (isIDTEmployee) {
            // Skipping idt.com user creation
            console.log(`*** Skipping to create new user: ${fromEmail.address}`);
            return null;
        }
        // // check if we need to get ssoId
        // let ssoId: string = null;
        // if (fetchSsoId && isIDTEmployee) {
        //     ssoId = await fetchSsoId(fromEmail.address);
        //     console.log(`*** IDT Employee. User sso id: ${ssoId}`);
        // }
        // Set user access levels/settings if new user needs to be created
        let accessConfig = {
            accessLevelID: accessConfigs.externalUsers.accessLevelID,
            companyID: accessConfigs.externalUsers.companyID,
            homeGroupID: accessConfigs.externalUsers.homeGroupID
        };
        // if (isIDTEmployee) {
        //     // User has an @idt.com address. IDT company code and proper access level
        //     accessConfig.accessLevelID = accessConfigs.idtUsers.accessLevelID;
        //     accessConfig.companyID = accessConfigs.idtUsers.companyID;
        //     accessConfig.homeGroupID = accessConfigs.idtUsers.homeGroupID;
        // }
        // Create a new user
        console.log(`*** Creating new user: ${fromEmail.address}`);
        let userNames = parseEmailNames(fromEmail);
        user = await this.api.create("USER", (() => {
            let params = {
                firstName: userNames.firstName,
                lastName: userNames.lastName,
                emailAddr: fromEmail.address,
                accessLevelID: accessConfig.accessLevelID,
                companyID: accessConfig.companyID,
                homeGroupID: accessConfig.homeGroupID
            };
            // if (ssoId) {
            //     params.ssoUsername = ssoId;
            // }
            return params;
        })(), userFieldsToReturn);
        // User created
        console.log("*** User created! User: " + JSON.stringify(user));
        if (!user.ID) {
            throw new Error("Something went wrong while creating a new user! User ID is not defined! Result: " + JSON.stringify(user));
        }
        // We have an external user to IDT then we must assign a username and password for that user
        console.log("*** Assigning a token to the user!");
        // First, get a token for the registration process
        let token = await this.api.execute("USER", user.ID, 'assignUserToken');
        console.log(`Got token for new user! Token: ${JSON.stringify(token)}`);
        console.log("*** Generate password!");
        // now that we have a token, finish the registration
        user.password = randomPassword();
        // For unknown reasons you need to send the first and last name in again when completing the user reg. Just an AtTask thing.
        let data = await this.api.execute("USER", user.ID, 'completeUserRegistration', {
            firstName: userNames.firstName,
            lastName: userNames.lastName,
            token: token.result,
            title: "",
            newPassword: user.password
        });
        // For some reason when this works it only returns null ({"result":null}). I swear it wasn't doing that last week (11/25/14) today.
        console.log(`User registration complete! Result: ${JSON.stringify(data)}. User ID: ${user.ID}`);
        return user;
    }
    /**
     * For all provided user email addresses create corresponding user objects in Workfront.
     *
     * @returns {Promise<T>|Promise<R>|Promise} - created user objects
     */
    async getOrCreateUsersByEmail(console, userEmails, emailsToIgnore, otherConfigs, fieldsToReturn, fetchSsoId) {
        console.log(`Get or create users by email! Emails: ${JSON.stringify(userEmails)}`);
        // ignore service mailbox emails
        let ignoreEmails = new Set();
        // add all mail account emails to ignore
        for (let email of emailsToIgnore) {
            ignoreEmails.add(email.toLowerCase().trim());
        }
        // fetch users by email
        let userEmailsFetched = [];
        let usersFetched = [];
        for (let userEmail of userEmails) {
            if (!ignoreEmails.has(userEmail.address.toLowerCase().trim())) {
                usersFetched.push(this.getOrCreateUser(console, userEmail, otherConfigs.accessConfigs, fieldsToReturn, fetchSsoId));
                userEmailsFetched.push(userEmail.address);
            }
        }
        let users = await Promise.all(usersFetched);
        console.log("Users fetched or created! " + JSON.stringify(users));
        let result = new Map();
        for (let i = 0; i < userEmailsFetched.length; i++) {
            let email = userEmailsFetched[i];
            let user = users[i];
            result.set(email, user);
        }
        return result;
    }
    /**
     * Fetches a user from Workfront based on provided user id.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param userId - user id to fetch
     * @param fields - extra fields to return for user
     * @returns {Promise<User>} - fetched user
     */
    getUserById(console, userId, fields) {
        console.log("Getting User by id: " + userId);
        return this.api.get("USER", userId, fields).then((user) => {
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
    getTeamById(console, teamId, fields) {
        console.log("Getting Team by id: " + teamId);
        return this.api.get("TEAMOB", teamId, fields).then((team) => {
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
    getIssueById(console, issueId, fields) {
        console.log("Getting Issue by id: " + issueId);
        return this.api.get("OPTASK", issueId, fields).then((issue) => {
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
    getIssueByExtId(console, extRefID, fields) {
        console.log("Checking issue existence by extRefId: " + extRefID);
        return this.api.search("OPTASK", {
            extRefID: extRefID,
            extRefID_Mod: "eq"
        }, fields).then((issues) => {
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
    makeUpdatesAsUser(console, from, entityRef, updates, fields = []) {
        return this.execAsUser(console, from, (api, login) => {
            console.log("[makeUpdateAsUser] - Got login session for user: " + from.address + ", sessionId: " + login.sessionID);
            // update
            return api.edit(entityRef.objCode, entityRef.ID, updates, fields).then((updatedObj) => {
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
    getIssueByRefNr(console, refNr, fields) {
        return this.api.search("OPTASK", {
            referenceNumber: refNr,
            referenceNumber_Mod: "eq"
        }, fields).then((issues) => {
            if (issues.length) {
                return issues[0];
            }
            else {
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
    createIssueAsUser(console, fromEmail, params, fields) {
        console.log("*** Creating issue! Params: " + JSON.stringify(params));
        return this.execAsUser(console, fromEmail, (api) => {
            return api.create("OPTASK", params, fields);
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
    updateIssueAsUser(console, fromEmail, issueId, updates, fields) {
        console.log("*** Updating issue as User. Email: " + fromEmail.address + ", updates: " + JSON.stringify(updates));
        return this.execAsUser(console, fromEmail, (api, login) => {
            // update
            return api.edit("OPTASK", issueId, updates, fields).then((issue) => {
                console.log("Issue updated: " + JSON.stringify(issue));
                return issue;
            });
        });
    }
    /**
     * Creates a new Project with provided fields.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param params - fields to be set on an project
     * @returns {Promise<Project>} - created Project
     */
    createProjectAsUser(console, fromEmail, params, fields) {
        console.log("*** Creating project! Params: " + JSON.stringify(params));
        return this.execAsUser(console, fromEmail, (api) => {
            return api.create("PROJ", params, fields);
        });
    }
    /**
     * Creates a new Document Folder under a parent with provided fields.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param params - fields to be set on an issue
     * @returns {Promise<DocumentFolder>} - created Document Folder
     */
    createFolderAsUser(console, fromEmail, params, fields) {
        console.log("*** Creating document folder! Params: " + JSON.stringify(params));
        return this.execAsUser(console, fromEmail, (api) => {
            return api.create("DOCFDR", params, fields);
        });
    }
    /**
     * Searches for a task based on task ref nr.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param refNr - a reference number got from email body
     * @returns {Promise<Task>} - a task if found, otherwise null
     */
    getOrCreateDocumentFolder(console, fromEmail, folderParentField, folderName, fields, parentFolderId) {
        if (!folderParentField) {
            return Promise.reject(`Document folder parent entity field name (issueID, taskID, projectID) is required to create a folder! Requested folder name: ${folderName}`);
        }
        console.log(`*** Searching document folder! Folder name: ${folderName}, entity field: ${JSON.stringify(folderParentField)}, parent folder id: ${parentFolderId}`);
        return this.api.search("DOCFDR", (() => {
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
                return this.createFolderAsUser(console, fromEmail, (() => {
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
    /**
     * Creates new documents from uploaded entities and sets a reference to provided parent entity - issue for example.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param parentRef - reference to entity the created docuements are related to
     * @param upload - references to upload entities
     * @returns {Promise<Document[]>|Promise} - created documents
     */
    createDocumentsAsUser(console, fromEmail, parentRef, upload, docFieldsToReturn, docFolder) {
        return this.execAsUser(console, fromEmail, (api, login) => {
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
    /**
     * Fetches a document from Workfront based on provided document id.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param docId - document id to fetch
     * @param fields - extra fields to return for a document
     * @returns {Promise<Document>} - fetched document
     */
    getDocumentById(console, docId, fields) {
        console.log("Getting Document by id: " + docId);
        return this.api.get("DOCU", docId, fields).then((doc) => {
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
    getDocumentVersionById(console, docVerId, fields) {
        console.log("Getting Document Version by id: " + docVerId + ", fields to return: " + JSON.stringify(fields));
        return this.api.get("DOCV", docVerId, fields).then((docVer) => {
            return docVer;
        });
    }
    /**
     * Fetches a document approval from Workfront based on provided document approval id.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param docApprovalId - document approval id to fetch
     * @param fields - extra fields to return for a document
     * @returns {Promise<DocumentApproval>} - fetched document approval
     */
    getDocumentApprovalById(console, docApprovalId, fields) {
        console.log("Getting Document Approval by id: " + docApprovalId);
        return this.api.get("DOCAPL", docApprovalId, fields).then((approval) => {
            return approval;
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
    createNoteAsUser(console, user, params, fieldsToReturn) {
        console.log("*** Creating Note with User email: " + user.address + ", params: " + JSON.stringify(params));
        return this.execAsUser(console, user, (api, login) => {
            let userId = login.userID;
            // create a note
            params.ownerID = userId;
            return api.create("NOTE", params, fieldsToReturn).then((note) => {
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
    createReplyNoteAsUser(console, fromEmail, reply, replyToEntityRef, fieldsToReturn) {
        console.log("*** Creating Reply Note with User email: " + fromEmail.address + ", note update: " + JSON.stringify(reply));
        return this.execAsUser(console, fromEmail, (api, login) => {
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
                    return Promise.reject(`!!!!ERROR!!!! An unrecognized object type ${replyToEntityRef.objCode} while creating a reply note was just entered.`);
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
            return api.create("NOTE", params, fieldsToReturn).then((note) => {
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
    getNoteById(console, noteId, fields) {
        console.log("Getting Note by id: " + noteId);
        return this.api.get("NOTE", noteId, fields).then((note) => {
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
    getJournalEntryById(console, journalEntryId, fields) {
        console.log("Getting Journal Entry by id: " + journalEntryId);
        return this.api.get("JRNLE", journalEntryId, fields).then((jrnle) => {
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
    getTaskByRefNr(console, refNr, fields) {
        if (!fields) {
            fields = ["referenceNumber"];
        }
        return this.api.search("TASK", {
            referenceNumber: refNr,
            referenceNumber_Mod: "eq"
        }, fields).then((tasks) => {
            if (tasks.length) {
                return tasks[0];
            }
            else {
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
    updateTaskAsUser(console, fromEmail, taskId, updates) {
        console.log("*** Updating task as User. Email: " + fromEmail.address + ", updates: " + JSON.stringify(updates));
        return this.execAsUser(console, fromEmail, (api, login) => {
            // update
            return api.edit("TASK", taskId, updates).then((task) => {
                console.log("Task updated: " + JSON.stringify(task));
                return task;
            });
        });
    }
    /**
     * Query for team members
     */
    getTeamMembers(console, teamId, fields) {
        let fieldsToReturn = ["ID", "name", "teamMembers:*"];
        if (fields) {
            fieldsToReturn = fields;
        }
        return this.api.get("TEAMOB", teamId, fieldsToReturn).then((team) => {
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
    findDocVJournalEntry(console, docv, fieldsToReturn) {
        return this.api.search("JRNLE", {
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
    /**
     */
    uploadPdfDocumentAsUser(console, fromEmail, parentRef, buffer, fileName, docFolder, docFieldsToReturn) {
        return this.execAsUser(console, fromEmail, (api, login) => {
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
    /**
     * Download a document under a provided user
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param ownerUsername - document is downloaded with this user session
     * @param downloadUrl - a document Url
     * @param output - a writeable stream to save the document
     * @returns {Promise<void>|Promise}
     */
    downloadAsUser(console, ownerUsername, downloadURL, output) {
        console.log(`*** Downloading document as Owner. Username: ${ownerUsername}, download url: ${downloadURL}"`);
        return this.execAsUser(console, { address: ownerUsername, name: "" }, (api, login) => {
            // download
            return api.download(downloadURL, output);
        });
    }
    /**
     * Remove an entity from Workfront under a specified user
     *
     * @param {Workfront.Logger} console
     * @param {EmailAddress} from
     * @param {WfModel.WfObject} entityRef
     * @returns {Promise<WfModel.WfObject>}
     */
    removeAsUser(console, from, entityRef, bForce) {
        return this.execAsUser(console, from, (api, login) => {
            console.log("[removeAsUser] - Got login session for user: " + from.address + ", sessionId: " + login.sessionID);
            // remove
            return api.remove(entityRef.objCode, entityRef.ID, bForce).then((removedObj) => {
                console.log(`[removeAsUser] ${entityRef.objCode}, ID: ${entityRef.ID}, removed obj: ${JSON.stringify(removedObj)}`);
                return removedObj;
            });
        });
    }
}
// constants
Workfront.API_DATE_FORMAT = "YYYY-MM-DD'T'HH:mm:ss:SSSZ"; // Date format in API requests: 2016-08-30T03:52:05:383-0700
Workfront.DOCV_PROCESSED_MARK = "CLOVER-VER:".toUpperCase();
/**
 * Workfront API connection settings
 */
Workfront.apiFactoryConfig = {
    url: "https://idt.my.workfront.com",
    //url: "https://idt.attasksandbox.com/" // TEST
    //version: "4.0"
    //version: "5.0"
    //version: "6.0"
    version: "7.0"
    //version: "internal"
};
exports.Workfront = Workfront;
// types
(function (Workfront) {
    ;
    ;
    Workfront.DocumentFolderParentField = model_1.WfModel.DocumentFolderParentField;
    Workfront.Issue = model_1.WfModel.Issue;
    Workfront.ReplyMessage = model_1.WfModel.ReplyMessage;
    Workfront.IssueUpdate = model_1.WfModel.IssueUpdate;
})(Workfront = exports.Workfront || (exports.Workfront = {}));
