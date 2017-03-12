/// <reference types="node" />

import {RequestOptions} from "http";
import * as fs from "fs";

/**
 * A Typescript API for Workfront module
 */
declare namespace Workfront {
    interface HttpParams {
        apiKey: string;
    }
    interface Config {
        url: string;
        version: string;
        alwaysUseGet?: boolean;
        secureProtocol?: string;
    }
    interface Methods {
        GET: string;
        PUT: string;
        DELETE: string;
        POST: string;
    }
    interface LoginResult {
        userID: string;
        sessionID: string;
        // ...
    }
    // type ApiObject = "USER" | "OPTASK" | "DOCU";

    /**
     * Use this to create a new instance of the Api object or an existing one
     */
    export class ApiFactory {
        /**
         * Use this to create a new instance of the Api object or an existing one.
         *
         * @param config - connection settings
         * @param returnNewInstance - if true then returns always a new instance, otherwise returns an existsing one
         */
        static getInstance(config: Config, returnNewInstance?: boolean): Api;
    }
    export class ApiUtil {
    }
    export class ApiConstants {
    }

    /**
     * A Typescript API for instantiated Api object.
     *
     * Use ApiFactory to get an instance of this class.
     */
    export class Api {
        httpOptions: RequestOptions;
        httpParams: HttpParams;
        Methods: Methods;

        /**
         * Creates an instance of this class.
         *
         * @param config - settings to connect to Workfront server
         */
        constructor(config: Config);

        /**
         * Logs into Workfront. Should be a first call to Workfront API. Other calls should be made after this one will be completed.
         *
         * @param username - A username in Workfront
         * @param password - Password to use, if not provided then apiKey must set before this call!
         */
        login(username: string, password?: string): Promise<LoginResult>;

        /**
         * Logs out from Workfront
         */
        logout(): Promise<Object>;

        /**
         * Creates a new object.
         *
         * @param objCode - One of object codes from Workfront API Explorer
         * @param params - Values of fields to be set for the new object. See Workfront API Explorer for the list of available fields for the given objCode
         * @param fields - Which fields of newly created object to return. See Workfront API Explorer for the list of available fields for the given objCode
         */
        create<T>(objCode: string, params: Object, fields?: string|string[]): Promise<T>;

        /**
         * Edits an existing object
         *
         * @param objCode - One of object codes from Workfront API Explorer
         * @param objID - ID of object to modify
         * @param updates - Which fields to set. See Workfront API Explorer for the list of available fields for the given objCode
         * @param fields - Which fields to return. See Workfront API Explorer for the list of available fields for the given objCode
         */
        edit<T>(objCode: string, objID: string, updates: Object, fields?: string|string[]): Promise<T>;


        /**
         * Copies an existing object with making changes on a copy. Copying is supported only for some objects.
         * The Workfront API Explorer page displays which objects support the Copy action.
         *
         * @param objCode - One of object codes from Workfront API Explorer
         * @param objID - ID of object to copy
         * @param updates - Which fields to set on copied object. See Workfront API Explorer for the list of available fields for the given objCode
         * @param fields - Which fields to return. See Workfront API Explorer for the list of available fields for the given objCode
         */
        copy<T>(objCode: string, objID: string, updates: Object, fields?: string|string[]): Promise<T>;

        /**
         * Used to retrieve number of objects matching given search criteria
         *
         * @param objCode - One of object codes from Workfront API Explorer
         * @param query - An object with search criteria
         */
        count<T>(objCode: string, query: string): Promise<T>;

        /**
         * Executes an action for the given object
         *
         * @param objCode - One of object codes from Workfront API Explorer
         * @param objID - ID of object. Optional, pass null or undefined to omit
         * @param action - An action to execute. A list of allowed actions are available within the Workfront API Explorer under "actions" for each object.
         * @param actionArgs - Arguments for the action. See Workfront API Explorer for the list of valid arguments
         */
        execute<T>(objCode: string, objID: string, action: string, actionArgs?: Object): Promise<T>;

        /**
         * Used for retrieve an object or multiple objects.
         *
         * @param objCode - One of object codes from Workfront API Explorer
         * @param objIDs - Either one or multiple object ids
         * @param fields - Which fields to return. See Workfront API Explorer for the list of available fields for the given objCode.
         */
        get<T>(objCode: string, objIDs: string|string[], fields?: string|string[]): Promise<T>;

        /**
         * Retrieves API metadata for an object.
         *
         * @param objCode - One of object codes from Workfront API Explorer. If omitted will return list of objects available in API.
         */
        metadata<T>(objCode?: string, useCache?: boolean): Promise<T>;

        /**
         * Executes a named query for the given obj code
         *
         * @param objCode - One of object codes from Workfront API Explorer
         * @param query - A query to execute. A list of allowed named queries are available within the Workfront API Explorer under "actions" for each object.
         * @param queryArgs - Arguments for the action. See Workfront API Explorer for the list of valid arguments
         * @param fields - Which fields to return. See Workfront API Explorer for the list of available fields for the given objCode.
         */
        namedQuery<T>(objCode: string, query: string, queryArgs?: Object, fields?: string|string[]): Promise<T>;

        /**
         * Deletes an object
         *
         * @param objCode - One of object codes from Workfront API Explorer
         * @param objID - ID of object
         * @param bForce - Pass true to cause the server to remove the specified data and its dependants
         */
        remove<T>(objCode: string, objID: string, bForce?: boolean): Promise<T>;

        /**
         * Performs report request, where only the aggregate of some field is desired, with one or more groupings.
         *
         * @param objCode - One of object codes from Workfront API Explorer
         * @param query - An object with search criteria and aggregate functions
         */
        report<T>(objCode: string, query: Object): Promise<T>;

        /**
         * Used for object retrieval by multiple search criteria.
         *
         * @param objCode - One of object codes from Workfront API Explorer
         * @param query - An object with search criteria
         * @param fields - An optional list of field names
         * @fields fields - Which fields to return. See Workfront API Explorer for the list of available fields for the given objCode.
         */
        search<T>(objCode: string, query: Object, fields?: string | string[]): Promise<T>;

        /**
         * Shares an object with a user
         *
         * @param objId - The ID of the object
         * @param userId - The userID to share with
         * @param objCode - The object code (type of object)
         * @param shareMethod - A selection of share type contribute, view, or manage
         */
        share<T>(objCode: string, objId: string, userId: string, shareMethod: string): Promise<T>;

        /**
         * Starting from version 2.0 API allows users to upload files.
         * The server will return the JSON data which includes 'handle' of uploaded file.
         * Returned 'handle' can be passed to create() method to create a new document.
         * This method is not available for browser execution environments and it is available only for Node.
         *
         * @param stream - A readable stream with file contents
         * @param overrides - Override the filename and content type (using keys `filename` and `contentType` respectively).
         */
        upload<T>(stream: fs.ReadStream|Buffer|string, overrides?: {filename: string, contentType: string}): Promise<T>;

        /**
         * Download a document from Workfront.
         *
         * @param downloadURL
         * @param output
         */
        download(downloadURL: string, output: NodeJS.WritableStream): Promise<void>;

        /**
         * Used to obtain an API key
         *
         * @param username - A username in Workfront
         * @param password - Password to use
         */
        getApiKey<T>(username: string, password: string): Promise<T>;

        /**
         * Invalidates the current API key. Call this to be able to retrieve a new one using getApiKey()
         */
        clearApiKey<T>(): Promise<T>;
    }
}
export = Workfront;
