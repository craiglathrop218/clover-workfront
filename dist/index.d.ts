/// <reference types="node" />
import { Api, Config, LoginResult } from "workfront-api";
import * as moment from "moment";
import { EmailAddress, Attachment } from "mailparser";
import { WfModel } from "./model";
/**
 * A Workfront internal API for our project that provides a convenient and wrapped methods to be used in different usage scenarios.
 */
export declare class Workfront {
    static API_DATE_FORMAT: string;
    static DOCV_PROCESSED_MARK: string;
    /**
     * Workfront API connection settings
     */
    static apiFactoryConfig: Config;
    apiFactoryConfig: Config;
    api: Api;
    constructor(config?: Config);
    setApiKey(key: string): void;
    /**
     * Login as a user with specified login email
     *
     * @param fromEmail - user login email
     * @returns {Promise<LoginResult>}
     */
    login(console: Workfront.Logger, fromEmail: EmailAddress, waitDelay?: number): Promise<LoginResult>;
    /**
     * Login as a user with specified login email
     *
     * @param fromEmail - user login email
     * @returns {Promise<LoginResult>}
     */
    logout(login: LoginResult): Promise<Object>;
    execAsUserWithSession<T>(console: Workfront.Logger, fromEmail: EmailAddress, callback: (api: Api, login: LoginResult) => Promise<T>, login: LoginResult): Promise<T>;
    /**
     * Logs in as user and execute provided function
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param fromEmail - execute a provided function under this user
     * @param callback - a function to execute under logged in user
     * @returns {Promise<T} - T
     */
    execAsUser<T>(console: Workfront.Logger, fromEmail: EmailAddress, callback: (api: Api, login: LoginResult) => Promise<T>): Promise<T>;
    /**
     * Fetches a project from Workfront based on provided project id.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param projId - project id to fetch
     * @param fields - extra fields to return for the project
     * @returns {Promise<Project>} - fetched project
     */
    getProjectById(console: Workfront.Logger, projId: string, fields?: string | string[]): Promise<WfModel.Project>;
    /**
     * Searches for a project from Workfront based on provided project reference nr.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param refNr - project reference nr.
     * @returns {Promise<Project>} - a project if found, otherwise null
     */
    getProjectByRefNr(console: Workfront.Logger, refNr: string): Promise<WfModel.Project>;
    /**
     * Upload provided attachments to the Workfront server.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param attachments - attachments to upload
     * @returns {Promise<Upload>|Promise} - an object containing provided attachments and Workfront reference handles to them
     */
    uploadMailAttachmentsAsUser(console: Workfront.Logger, fromEmail: EmailAddress, attachments: Attachment[]): Promise<Workfront.Upload>;
    /**
     * Fetches an existing user from Workfront based on provided email address or if not found then creates a new user.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param fromEmail - an email address of a user that sent the email
     * @param accessConfigs - the workfront access settings / levels for a user
     * @returns {Promise<User>|Promise}
     */
    getOrCreateUser(console: Workfront.Logger, fromEmail: EmailAddress, accessConfigs: {
        externalUsers: Workfront.UserAccessConfig;
        idtUsers: Workfront.UserAccessConfig;
    }, fetchSsoId?: Workfront.FetchSsoId): Promise<WfModel.User>;
    /**
     * For all provided user email addresses create corresponding user objects in Workfront.
     *
     * @returns {Promise<T>|Promise<R>|Promise} - created user objects
     */
    getOrCreateUsersByEmail(console: Workfront.Logger, userEmails: EmailAddress[], emailsToIgnore: string[], otherConfigs: any, fetchSsoId: Workfront.FetchSsoId): Promise<WfModel.User[]>;
    /**
     * Fetches a user from Workfront based on provided user id.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param userId - user id to fetch
     * @param fields - extra fields to return for user
     * @returns {Promise<User>} - fetched user
     */
    getUserById(console: Workfront.Logger, userId: string, fields?: string | string[]): Promise<WfModel.User>;
    /**
     * Fetches a team from Workfront based on provided team id.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param teamId - team id to fetch
     * @param fields - extra fields to return for team
     * @returns {Promise<Team>} - fetched team
     */
    getTeamById(console: Workfront.Logger, teamId: string, fields?: string | string[]): Promise<WfModel.Team>;
    /**
     * Fetches an issue from Workfront based on provided issue id.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param issueId - issue id to fetch
     * @param fields - extra fields to return for an issue
     * @returns {Promise<Issue>} - fetched issue
     */
    getIssueById(console: Workfront.Logger, issueId: string, fields?: string | string[]): Promise<WfModel.Issue>;
    /**
     * Searches for an issue from Workfront based on provided external extRefID - email id.
     *
     * If email comes in then an email id is put into a field named "extRefID" on an issue. So we can search later for an existing issue based on that field.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param extRefID - an email id.
     * @returns {Promise<Issue>} - an issue if found based on email id
     */
    getIssueByExtId(console: Workfront.Logger, extRefID: string): Promise<WfModel.Issue>;
    /**
     * A generic function for updating any object on behalf of another user.
     * @param userEmail
     * @param updates
     * @param objId
     * @param objCode
     * @param fields
     * @returns {any}
     */
    makeUpdatesAsUser(console: Workfront.Logger, from: EmailAddress, entityRef: WfModel.WfObject, updates: any, fields?: any[]): Promise<WfModel.WfObject>;
    /**
     * Searches for an issue from Workfront based on provided issue reference nr.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param refNr - issue reference nr. Got from an email body
     * @returns {Promise<Issue>} - an issue if found, otherwise null
     */
    getIssueByRefNr(console: Workfront.Logger, refNr: string): Promise<WfModel.Issue>;
    /**
     * Creates a new Issue with provided fields.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param params - fields to be set on an issue
     * @returns {Promise<Issue>} - created Issue
     */
    createIssueAsUser(console: Workfront.Logger, fromEmail: EmailAddress, params: Object): Promise<WfModel.Issue>;
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
    updateIssueAsUser(console: Workfront.Logger, fromEmail: EmailAddress, issueId: string, updates: Object, fields?: string | string[]): Promise<WfModel.Issue>;
    /**
     * Creates a new Document Folder under a parent with provided fields.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param params - fields to be set on an issue
     * @returns {Promise<DocumentFolder>} - created Document Folder
     */
    createFolderAsUser(console: Workfront.Logger, fromEmail: EmailAddress, params: Object, fields?: string | string[]): Promise<WfModel.DocumentFolder>;
    /**
     * Searches for a task based on task ref nr.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param refNr - a reference number got from email body
     * @returns {Promise<Task>} - a task if found, otherwise null
     */
    getOrCreateDocumentFolder(console: Workfront.Logger, fromEmail: EmailAddress, folderParentField: WfModel.DocumentFolderParentField, folderName: string, fields?: string | string[], parentFolderId?: string): Promise<WfModel.DocumentFolder>;
    /**
     * Creates new documents from uploaded entities and sets a reference to provided parent entity - issue for example.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param parentRef - reference to entity the created docuements are related to
     * @param upload - references to upload entities
     * @returns {Promise<Document[]>|Promise} - created documents
     */
    createDocumentsAsUser(console: Workfront.Logger, fromEmail: EmailAddress, parentRef: WfModel.WfObject, upload: Workfront.Upload, docFieldsToReturn: string[], docFolder?: WfModel.DocumentFolder): Promise<WfModel.Document[]>;
    /**
     * Fetches a document from Workfront based on provided document id.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param docId - document id to fetch
     * @param fields - extra fields to return for a document
     * @returns {Promise<Document>} - fetched document
     */
    getDocumentById(console: Workfront.Logger, docId: string, fields?: string | string[]): Promise<WfModel.Document>;
    /**
     * Fetches a document version from Workfront based on provided document version id.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param docVerId - document version id to fetch
     * @param fields - extra fields to return for a document version
     * @returns {Promise<DocumentVersion>} - fetched document version
     */
    getDocumentVersionById(console: Workfront.Logger, docVerId: string, fields?: string | string[]): Promise<WfModel.DocumentVersion>;
    /**
     * Fetches a document approval from Workfront based on provided document approval id.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param docApprovalId - document approval id to fetch
     * @param fields - extra fields to return for a document
     * @returns {Promise<DocumentApproval>} - fetched document approval
     */
    getDocumentApprovalById(console: Workfront.Logger, docApprovalId: string, fields?: string | string[]): Promise<WfModel.DocumentApproval>;
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
    createNoteAsUser(console: Workfront.Logger, user: EmailAddress, params: WfModel.Note): Promise<WfModel.Note>;
    /**
     * Create a reply note as a user with provided email.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param fromEmail - create a new reply note as a user with this provided email
     * @param reply - a reply object containing target entity and reply message
     * @returns {Promise<Note>|Promise} - a new reply Note object that was created
     */
    createReplyNoteAsUser(console: Workfront.Logger, fromEmail: EmailAddress, reply: WfModel.ReplyMessage, replyToEntityRef: WfModel.WfObject): Promise<WfModel.Note>;
    /**
     * Fetches the Note object from Workfront based on provided note id.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param noteId - note id
     * @param fields - extra fields to return
     * @returns {Promise<Note>} - Note object corresponding to provided note id
     */
    getNoteById(console: Workfront.Logger, noteId: string, fields?: string | string[]): Promise<WfModel.Note>;
    /**
     * Fetches the Note object from Workfront based on referenced journal entry id.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param journalEntryId - journal entry id
     * @param fields - extra fields to return
     * @returns {Promise<Note>} - Note object corresponding to provided note id
     */
    getJournalEntryById(console: Workfront.Logger, journalEntryId: string, fields?: string | string[]): Promise<WfModel.JournalEntry>;
    /**
     * Searches for a task based on task ref nr.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param refNr - a reference number got from email body
     * @returns {Promise<Task>} - a task if found, otherwise null
     */
    getTaskByRefNr(console: Workfront.Logger, refNr: string): Promise<WfModel.Task>;
    /**
     * Update existing task as a user with provided email.
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param fromEmail - update task as a user with this email
     * @param taskId - task id to update
     * @param updates - update fields on task
     * @returns {Promise<Task>|Promise} - update task
     */
    updateTaskAsUser(console: Workfront.Logger, fromEmail: EmailAddress, taskId: string, updates: Object): Promise<WfModel.Task>;
    /**
     * Query for team members
     */
    getTeamMembers(console: Workfront.Logger, teamId: string): Promise<WfModel.TeamMember[]>;
    /**
     * Find DocV corresponding journal entry
     */
    findDocVJournalEntry(console: Workfront.Logger, docv: WfModel.DocumentVersion, fieldsToReturn?: string | string[]): Promise<WfModel.JournalEntry>;
    /**
     */
    uploadPdfDocumentAsUser(console: Workfront.Logger, fromEmail: EmailAddress, parentRef: WfModel.WfObject, buffer: Buffer | string, fileName: string, docFolder: WfModel.DocumentFolder, docFieldsToReturn: string[]): Promise<WfModel.Document>;
    /**
     * Download a document under a provided user
     *
     * @param console - logger object (for later debugging in case of errors happen in processing)
     * @param ownerUsername - document is downloaded with this user session
     * @param downloadUrl - a document Url
     * @param output - a writeable stream to save the document
     * @returns {Promise<void>|Promise}
     */
    downloadAsUser(console: Workfront.Logger, ownerUsername: string, downloadURL: string, output: NodeJS.WritableStream): Promise<void>;
}
export declare namespace Workfront {
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
    export import Portfolio = WfModel.Portfolio;
    export import Program = WfModel.Program;
    export import User = WfModel.User;
    export import Document = WfModel.Document;
    export import DocumentVersion = WfModel.DocumentVersion;
    export import DocumentFolder = WfModel.DocumentFolder;
    export import DocumentFolderParentField = WfModel.DocumentFolderParentField;
    export import DocumentApproval = WfModel.DocumentApproval;
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
    export import Assignment = WfModel.Assignment;
    export import Role = WfModel.Role;
    export import BaselineTask = WfModel.BaselineTask;
    interface WfConnError {
        active: boolean;
        errorDate: moment.Moment;
    }
}
