/// <reference types="workfront-api" />
/// <reference types="node" />
import * as moment from "moment";
import { EmailAddress, Attachment } from "mailparser";
import { Api, LoginResult } from "workfront-api";
import { WfModel } from "./model";
/**
 * Workfront API connection settings
 */
export declare let apiFactoryConfig: {
    url: string;
    version: string;
};
/**
 * A Workfront internal API for our project that provides a convenient and wrapped methods to be used in different usage scenarios.
 */
export declare namespace Workfront {
    var api: Api;
    function setApiKey(key: string): void;
    /**
     * Defines user access object
     */
    interface UserAccessConfig {
        accessLevelID: string;
        companyID: string;
        homeGroupID: string;
    }
    interface FetchSsoId {
        (email: string): Promise<string>;
    }
    /**
     * A logger interface for this project.
     */
    interface Logger {
        log(msg: string): string;
    }
    /**
     * A context object for workfront calls
     */
    interface WfContext extends Logger {
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
    interface UploadHandle {
        handle: string;
    }
    interface Upload {
        attachments: Attachment[];
        handles: UploadHandle[];
    }
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
    interface WfConnError {
        active: boolean;
        errorDate: moment.Moment;
    }
    const API_DATE_FORMAT = "YYYY-MM-DD'T'HH:mm:ss:SSSZ";
    const DOCV_PROCESSED_MARK: string;
    /**
     * Login as a user with specified login email
     *
     * @param fromEmail - user login email
     * @returns {Promise<LoginResult>}
     */
    function login(console: Logger, fromEmail: EmailAddress, waitDelay?: number): Promise<LoginResult>;
    /**
     * Login as a user with specified login email
     *
     * @param fromEmail - user login email
     * @returns {Promise<LoginResult>}
     */
    function logout(login: LoginResult): Promise<Object>;
    function execAsUserWithSession<T>(console: Logger, fromEmail: EmailAddress, callback: (api: Api, login: LoginResult) => Promise<T>, login: LoginResult): Promise<T>;
    /**
     * Logs in as user and execute provided function
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param fromEmail - execute a provided function under this user
     * @param callback - a function to execute under logged in user
     * @returns {Promise<T} - T
     */
    function execAsUser<T>(console: Logger, fromEmail: EmailAddress, callback: (api: Api, login: LoginResult) => Promise<T>): Promise<T>;
    /**
     * Fetches a project from Workfront based on provided project id.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param projId - project id to fetch
     * @param fields - extra fields to return for the project
     * @returns {Promise<Project>} - fetched project
     */
    function getProjectById(console: Logger, projId: string, fields?: string | string[]): Promise<Project>;
    /**
     * Searches for a project from Workfront based on provided project reference nr.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param refNr - project reference nr.
     * @returns {Promise<Project>} - a project if found, otherwise null
     */
    function getProjectByRefNr(console: Logger, refNr: string): Promise<Project>;
    /**
     * Upload provided attachments to the Workfront server.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param attachments - attachments to upload
     * @returns {Promise<Upload>|Promise} - an object containing provided attachments and Workfront reference handles to them
     */
    function uploadMailAttachmentsAsUser(console: Logger, fromEmail: EmailAddress, attachments: Attachment[]): Promise<Upload>;
    /**
     * Fetches an existing user from Workfront based on provided email address or if not found then creates a new user.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param fromEmail - an email address of a user that sent the email
     * @param accessConfigs - the workfront access settings / levels for a user
     * @returns {Promise<User>|Promise}
     */
    function getOrCreateUser(console: Logger, fromEmail: EmailAddress, accessConfigs: {
        externalUsers: UserAccessConfig;
        idtUsers: UserAccessConfig;
    }, fetchSsoId?: FetchSsoId): Promise<User>;
    /**
     * For all provided user email addresses create corresponding user objects in Workfront.
     *
     * @returns {Promise<T>|Promise<R>|Promise} - created user objects
     */
    function getOrCreateUsersByEmail(console: Logger, userEmails: EmailAddress[], emailsToIgnore: string[], otherConfigs: any, fetchSsoId: FetchSsoId): Promise<User[]>;
    /**
     * Fetches a user from Workfront based on provided user id.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param userId - user id to fetch
     * @param fields - extra fields to return for user
     * @returns {Promise<User>} - fetched user
     */
    function getUserById(console: Logger, userId: string, fields?: string | string[]): Promise<User>;
    /**
     * Fetches a team from Workfront based on provided team id.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param teamId - team id to fetch
     * @param fields - extra fields to return for team
     * @returns {Promise<Team>} - fetched team
     */
    function getTeamById(console: Logger, teamId: string, fields?: string | string[]): Promise<Team>;
    /**
     * Fetches an issue from Workfront based on provided issue id.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param issueId - issue id to fetch
     * @param fields - extra fields to return for an issue
     * @returns {Promise<Issue>} - fetched issue
     */
    function getIssueById(console: Logger, issueId: string, fields?: string | string[]): Promise<Issue>;
    /**
     * Searches for an issue from Workfront based on provided external extRefID - email id.
     *
     * If email comes in then an email id is put into a field named "extRefID" on an issue. So we can search later for an existing issue based on that field.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param extRefID - an email id.
     * @returns {Promise<Issue>} - an issue if found based on email id
     */
    function getIssueByExtId(console: Logger, extRefID: string): Promise<Issue>;
    /**
     * A generic function for updating any object on behalf of another user.
     * @param userEmail
     * @param updates
     * @param objId
     * @param objCode
     * @param fields
     * @returns {any}
     */
    function makeUpdatesAsUser(console: Logger, from: EmailAddress, entityRef: WfObject, updates: any, fields?: any[]): Promise<WfObject>;
    /**
     * Searches for an issue from Workfront based on provided issue reference nr.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param refNr - issue reference nr. Got from an email body
     * @returns {Promise<Issue>} - an issue if found, otherwise null
     */
    function getIssueByRefNr(console: Logger, refNr: string): Promise<Issue>;
    /**
     * Creates a new Issue with provided fields.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param params - fields to be set on an issue
     * @returns {Promise<Issue>} - created Issue
     */
    function createIssueAsUser(console: Logger, fromEmail: EmailAddress, params: Object): Promise<Issue>;
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
    function updateIssueAsUser(console: Logger, fromEmail: EmailAddress, issueId: string, updates: Object, fields?: string | string[]): Promise<Issue>;
    /**
     * Creates a new Document Folder under a parent with provided fields.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param params - fields to be set on an issue
     * @returns {Promise<DocumentFolder>} - created Document Folder
     */
    function createFolderAsUser(console: Logger, fromEmail: EmailAddress, params: Object, fields?: string | string[]): Promise<DocumentFolder>;
    /**
     * Searches for a task based on task ref nr.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param refNr - a reference number got from email body
     * @returns {Promise<Task>} - a task if found, otherwise null
     */
    function getOrCreateDocumentFolder(console: Logger, fromEmail: EmailAddress, folderParentField: DocumentFolderParentField, folderName: string, fields?: string | string[], parentFolderId?: string): Promise<DocumentFolder>;
    /**
     * Creates new documents from uploaded entities and sets a reference to provided parent entity - issue for example.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param parentRef - reference to entity the created docuements are related to
     * @param upload - references to upload entities
     * @returns {Promise<Document[]>|Promise} - created documents
     */
    function createDocumentsAsUser(console: Logger, fromEmail: EmailAddress, parentRef: WfObject, upload: Upload, docFieldsToReturn: string[], docFolder?: DocumentFolder): Promise<Document[]>;
    /**
     * Fetches a document from Workfront based on provided document id.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param docId - document id to fetch
     * @param fields - extra fields to return for a document
     * @returns {Promise<Document>} - fetched document
     */
    function getDocumentById(console: Logger, docId: string, fields?: string | string[]): Promise<Document>;
    /**
     * Fetches a document version from Workfront based on provided document version id.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param docVerId - document version id to fetch
     * @param fields - extra fields to return for a document version
     * @returns {Promise<DocumentVersion>} - fetched document version
     */
    function getDocumentVersionById(console: Logger, docVerId: string, fields?: string | string[]): Promise<DocumentVersion>;
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
    function createNoteAsUser(console: Logger, user: EmailAddress, params: Note): Promise<Note>;
    /**
     * Create a reply note as a user with provided email.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param fromEmail - create a new reply note as a user with this provided email
     * @param reply - a reply object containing target entity and reply message
     * @returns {Promise<Note>|Promise} - a new reply Note object that was created
     */
    function createReplyNoteAsUser(console: Logger, fromEmail: EmailAddress, reply: ReplyMessage, replyToEntityRef: Workfront.WfObject): Promise<Note>;
    /**
     * Fetches the Note object from Workfront based on provided note id.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param noteId - note id
     * @param fields - extra fields to return
     * @returns {Promise<Note>} - Note object corresponding to provided note id
     */
    function getNoteById(console: Logger, noteId: string, fields?: string | string[]): Promise<Note>;
    /**
     * Fetches the Note object from Workfront based on referenced journal entry id.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param journalEntryId - journal entry id
     * @param fields - extra fields to return
     * @returns {Promise<Note>} - Note object corresponding to provided note id
     */
    function getJournalEntryById(console: Logger, journalEntryId: string, fields?: string | string[]): Promise<JournalEntry>;
    /**
     * Searches for a task based on task ref nr.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param refNr - a reference number got from email body
     * @returns {Promise<Task>} - a task if found, otherwise null
     */
    function getTaskByRefNr(console: Logger, refNr: string): Promise<Task>;
    /**
     * Update existing task as a user with provided email.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param fromEmail - update task as a user with this email
     * @param taskId - task id to update
     * @param updates - update fields on task
     * @returns {Promise<Task>|Promise} - update task
     */
    function updateTaskAsUser(console: Logger, fromEmail: EmailAddress, taskId: string, updates: Object): Promise<Task>;
    /**
     * Query for team members
     */
    function getTeamMembers(console: Logger, teamId: string): Promise<TeamMember[]>;
    /**
     * Find DocV corresponding journal entry
     */
    function findDocVJournalEntry(console: Logger, docv: DocumentVersion, fieldsToReturn?: string | string[]): Promise<JournalEntry>;
    /**
     */
    function uploadPdfDocumentAsUser(console: Logger, fromEmail: EmailAddress, parentRef: WfObject, buffer: Buffer | string, fileName: string, docFolder: Workfront.DocumentFolder, docFieldsToReturn: string[]): Promise<Document>;
    /**
     * Download a document under a provided user
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param ownerUsername - document is downloaded with this user session
     * @param downloadUrl - a document Url
     * @param output - a writeable stream to save the document
     * @returns {Promise<void>|Promise}
     */
    function downloadAsUser(console: Logger, ownerUsername: string, downloadURL: string, output: NodeJS.WritableStream): Promise<void>;
}
