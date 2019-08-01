/// <reference types="node" />
import moment from "moment";
import mailparser from "mailparser";
import api from "workfront-api";
import { WfModel } from "./model";
export interface Dictionary<T> {
    [key: string]: T;
}
export interface WorkfrontInitOptions {
    notFoundUserEmailMapping?: Dictionary<string>;
}
/**
 * A Workfront internal API for our project that provides a convenient and wrapped methods to be used in different usage scenarios.
 */
export declare class Workfront {
    static API_DATE_FORMAT: string;
    static DOCV_PROCESSED_MARK: string;
    /**
     * Workfront API connection settings
     */
    static apiFactoryConfig: api.Config;
    apiFactoryConfig: api.Config;
    api: api.Api;
    notFoundUserEmailMapping: Dictionary<string>;
    initialize(config: api.Config, key: string, initOptions?: WorkfrontInitOptions): void;
    setApiKey(key: string): void;
    /**
     * Login as a user with specified login email
     *
     * @param fromEmail - user login email
     * @returns {Promise<api.LoginResult>}
     */
    login(logger: Workfront.Logger, fromEmail: mailparser.EmailAddress, waitDelay?: number): Promise<api.LoginResult>;
    /**
     * Login as a user with specified login email
     *
     * @param fromEmail - user login email
     * @returns {Promise<api.LoginResult>}
     */
    logout(login: api.LoginResult): Promise<Object>;
    execAsUserWithSession<T>(logger: Workfront.Logger, fromEmail: mailparser.EmailAddress, callback: (api: api.Api, login: api.LoginResult) => Promise<T>, login: api.LoginResult): Promise<T>;
    /**
     * Logs in as user and execute provided function
     *
     * @param logger - logger object (for later debugging in case of errors happen in processing)
     * @param fromEmail - execute a provided function under this user
     * @param callback - a function to execute under logged in user
     * @returns {Promise<T} - T
     */
    execAsUser<T>(logger: Workfront.Logger, fromEmail: mailparser.EmailAddress, callback: (api: api.Api, login: api.LoginResult) => Promise<T>): Promise<T>;
    /**
     * Fetches a project from Workfront based on provided project id.
     *
     * @param logger - logger object (for later debugging in case of errors happen in processing)
     * @param projId - project id to fetch
     * @param fields - extra fields to return for the project
     * @returns {Promise<Project>} - fetched project
     */
    getProjectById(logger: Workfront.Logger, projId: string, fields?: string | string[]): Promise<WfModel.Project>;
    /**
     * Searches for a project from Workfront based on provided project reference nr.
     *
     * @param logger - logger object (for later debugging in case of errors happen in processing)
     * @param refNr - project reference nr.
     * @returns {Promise<Project>} - a project if found, otherwise null
     */
    getProjectByRefNr(logger: Workfront.Logger, refNr: string): Promise<WfModel.Project>;
    /**
     * Upload provided attachments to the Workfront server.
     *
     * @param logger - logger object (for later debugging in case of errors happen in processing)
     * @param attachments - attachments to upload
     * @returns {Promise<Upload>|Promise} - an object containing provided attachments and Workfront reference handles to them
     */
    uploadMailAttachmentsAsUser(logger: Workfront.Logger, fromEmail: mailparser.EmailAddress, attachments: mailparser.Attachment[]): Promise<Workfront.Upload>;
    /**
     * For all provided user email addresses create corresponding user objects in Workfront.
     *
     * @returns {Promise<T>|Promise<R>|Promise} - created user objects
     */
    getUsersByEmail(logger: Workfront.Logger, userEmails: mailparser.EmailAddress[], emailsToIgnore: string[], fieldsToReturn: string[]): Promise<Map<string, Workfront.User>>;
    /**
     * Fetches an existing user from Workfront based on provided email address
     *
     * @param logger - logger object (for later debugging in case of errors happen in processing)
     * @param fromEmail - an email address of a user that sent the email
     * @returns {Promise<User>|Promise}
     */
    getUserByEmail(logger: Workfront.Logger, fromEmail: mailparser.EmailAddress, fieldsToReturn: string[]): Promise<WfModel.User>;
    /**
     * Fetches an existing user from Workfront based on provided email address or if not found then creates a new user.
     *
     * @param logger - logger object (for later debugging in case of errors happen in processing)
     * @param fromEmail - an email address of a user that sent the email
     * @param accessConfigs - the workfront access settings / levels for a user
     * @returns {Promise<User>|Promise}
     */
    getOrCreateUser(logger: Workfront.Logger, fromEmail: mailparser.EmailAddress, accessConfigs: {
        externalUsers: Workfront.UserAccessConfig;
        idtUsers: Workfront.UserAccessConfig;
    }, userFieldsToReturn: string[]): Promise<WfModel.User>;
    /**
     * For all provided user email addresses create corresponding user objects in Workfront.
     *
     * @returns {Promise<T>|Promise<R>|Promise} - created user objects
     */
    getOrCreateUsersByEmail(logger: Workfront.Logger, userEmails: mailparser.EmailAddress[], emailsToIgnore: string[], otherConfigs: any, fieldsToReturn: string[]): Promise<Map<string, Workfront.User>>;
    /**
     * Fetches a user from Workfront based on provided user id.
     *
     * @param logger - logger object (for later debugging in case of errors happen in processing)
     * @param userId - user id to fetch
     * @param fields - extra fields to return for user
     * @returns {Promise<User>} - fetched user
     */
    getUserById(logger: Workfront.Logger, userId: string, fields?: string | string[]): Promise<WfModel.User>;
    /**
     * Fetches a team from Workfront based on provided team id.
     *
     * @param logger - logger object (for later debugging in case of errors happen in processing)
     * @param teamId - team id to fetch
     * @param fields - extra fields to return for team
     * @returns {Promise<Team>} - fetched team
     */
    getTeamById(logger: Workfront.Logger, teamId: string, fields?: string | string[]): Promise<WfModel.Team>;
    /**
     * Fetches an issue from Workfront based on provided issue id.
     *
     * @param logger - logger object (for later debugging in case of errors happen in processing)
     * @param issueId - issue id to fetch
     * @param fields - extra fields to return for an issue
     * @returns {Promise<Issue>} - fetched issue
     */
    getIssueById(logger: Workfront.Logger, issueId: string, fields?: string | string[]): Promise<WfModel.Issue>;
    /**
     * Searches for an issue from Workfront based on provided external extRefID - email id.
     *
     * If email comes in then an email id is put into a field named "extRefID" on an issue. So we can search later for an existing issue based on that field.
     *
     * @param logger - logger object (for later debugging in case of errors happen in processing)
     * @param extRefID - an email id.
     * @returns {Promise<Issue>} - an issue if found based on email id
     */
    getIssueByExtId(logger: Workfront.Logger, extRefID: string, fields?: string | string[]): Promise<WfModel.Issue>;
    /**
     * A generic function for updating any object on behalf of another user.
     * @param userEmail
     * @param updates
     * @param objId
     * @param objCode
     * @param fields
     * @returns {any}
     */
    makeUpdatesAsUser(logger: Workfront.Logger, from: mailparser.EmailAddress, entityRef: WfModel.WfObject, updates: any, fields?: any[]): Promise<WfModel.WfObject>;
    /**
     * Searches for an issue from Workfront based on provided issue reference nr.
     *
     * @param logger - logger object (for later debugging in case of errors happen in processing)
     * @param refNr - issue reference nr. Got from an email body
     * @returns {Promise<Issue>} - an issue if found, otherwise null
     */
    getIssueByRefNr(logger: Workfront.Logger, refNr: string, fields?: string | string[]): Promise<WfModel.Issue>;
    /**
     * Creates a new Issue with provided fields.
     *
     * @param logger - logger object (for later debugging in case of errors happen in processing)
     * @param params - fields to be set on an issue
     * @returns {Promise<Issue>} - created Issue
     */
    createIssueAsUser(logger: Workfront.Logger, fromEmail: mailparser.EmailAddress, params: Object, fields?: string | string[]): Promise<WfModel.Issue>;
    /**
     * Update issue as a user with provided email.
     *
     * @param logger - logger object (for later debugging in case of errors happen in processing)
     * @param fromEmail - update issue as a user with this provided email
     * @param issueId - issue id to update
     * @param updates - fields to update
     * @param fields - extra fields to return
     * @returns {Promise<Issue>|Promise} - update Issue
     */
    updateIssueAsUser(logger: Workfront.Logger, fromEmail: mailparser.EmailAddress, issueId: string, updates: Object, fields?: string | string[]): Promise<WfModel.Issue>;
    /**
     * Creates a new Project with provided fields.
     *
     * @param logger - logger object (for later debugging in case of errors happen in processing)
     * @param params - fields to be set on an project
     * @returns {Promise<Project>} - created Project
     */
    createProjectAsUser(logger: Workfront.Logger, fromEmail: mailparser.EmailAddress, params: Object, fields?: string | string[]): Promise<WfModel.Project>;
    /**
     * Creates a new Document Folder under a parent with provided fields.
     *
     * @param logger - logger object (for later debugging in case of errors happen in processing)
     * @param params - fields to be set on an issue
     * @returns {Promise<DocumentFolder>} - created Document Folder
     */
    createFolderAsUser(logger: Workfront.Logger, fromEmail: mailparser.EmailAddress, params: Object, fields?: string | string[]): Promise<WfModel.DocumentFolder>;
    /**
     * Searches for a task based on task ref nr.
     *
     * @param logger - logger object (for later debugging in case of errors happen in processing)
     * @param refNr - a reference number got from email body
     * @returns {Promise<Task>} - a task if found, otherwise null
     */
    getOrCreateDocumentFolder(logger: Workfront.Logger, fromEmail: mailparser.EmailAddress, folderParentField: WfModel.DocumentFolderParentField, folderName: string, fields?: string | string[], parentFolderId?: string): Promise<WfModel.DocumentFolder>;
    /**
     * Creates new documents from uploaded entities and sets a reference to provided parent entity - issue for example.
     *
     * @param logger - logger object (for later debugging in case of errors happen in processing)
     * @param parentRef - reference to entity the created docuements are related to
     * @param upload - references to upload entities
     * @returns {Promise<Document[]>|Promise} - created documents
     */
    createDocumentsAsUser(logger: Workfront.Logger, fromEmail: mailparser.EmailAddress, parentRef: WfModel.WfObject, upload: Workfront.Upload, docFieldsToReturn: string[], docFolder?: WfModel.DocumentFolder): Promise<WfModel.Document[]>;
    /**
     * Fetches a document from Workfront based on provided document id.
     *
     * @param logger - logger object (for later debugging in case of errors happen in processing)
     * @param docId - document id to fetch
     * @param fields - extra fields to return for a document
     * @returns {Promise<Document>} - fetched document
     */
    getDocumentById(logger: Workfront.Logger, docId: string, fields?: string | string[]): Promise<WfModel.Document>;
    /**
     * Fetches a document version from Workfront based on provided document version id.
     *
     * @param logger - logger object (for later debugging in case of errors happen in processing)
     * @param docVerId - document version id to fetch
     * @param fields - extra fields to return for a document version
     * @returns {Promise<DocumentVersion>} - fetched document version
     */
    getDocumentVersionById(logger: Workfront.Logger, docVerId: string, fields?: string | string[]): Promise<WfModel.DocumentVersion>;
    /**
     * Fetches a document approval from Workfront based on provided document approval id.
     *
     * @param logger - logger object (for later debugging in case of errors happen in processing)
     * @param docApprovalId - document approval id to fetch
     * @param fields - extra fields to return for a document
     * @returns {Promise<DocumentApproval>} - fetched document approval
     */
    getDocumentApprovalById(logger: Workfront.Logger, docApprovalId: string, fields?: string | string[]): Promise<WfModel.DocumentApproval>;
    /**
     * Creates a note under a provided user email.
     *
     * A user with provided email must exist in Workfront, otherwise a reject error is returned
     *
     * @param logger - logger object (for later debugging in case of errors happen in processing)
     * @param user - a user email under which to create a note
     * @param params - note fields
     * @returns {Promise<Note>|Promise} - created note
     */
    createNoteAsUser(logger: Workfront.Logger, user: mailparser.EmailAddress, params: WfModel.Note, fieldsToReturn: string[]): Promise<WfModel.Note>;
    /**
     * Create a reply note as a user with provided email.
     *
     * @param logger - logger object (for later debugging in case of errors happen in processing)
     * @param fromEmail - create a new reply note as a user with this provided email
     * @param reply - a reply object containing target entity and reply message
     * @returns {Promise<Note>|Promise} - a new reply Note object that was created
     */
    createReplyNoteAsUser(logger: Workfront.Logger, fromEmail: mailparser.EmailAddress, reply: WfModel.ReplyMessage, replyToEntityRef: WfModel.WfObject, fieldsToReturn: string[]): Promise<WfModel.Note>;
    /**
     * Fetches the Note object from Workfront based on provided note id.
     *
     * @param logger - logger object (for later debugging in case of errors happen in processing)
     * @param noteId - note id
     * @param fields - extra fields to return
     * @returns {Promise<Note>} - Note object corresponding to provided note id
     */
    getNoteById(logger: Workfront.Logger, noteId: string, fields?: string | string[]): Promise<WfModel.Note>;
    /**
     * Fetches the Note object from Workfront based on referenced journal entry id.
     *
     * @param logger - logger object (for later debugging in case of errors happen in processing)
     * @param journalEntryId - journal entry id
     * @param fields - extra fields to return
     * @returns {Promise<Note>} - Note object corresponding to provided note id
     */
    getJournalEntryById(logger: Workfront.Logger, journalEntryId: string, fields?: string | string[]): Promise<WfModel.JournalEntry>;
    /**
     * Searches for a task based on task ref nr.
     *
     * @param logger - logger object (for later debugging in case of errors happen in processing)
     * @param refNr - a reference number got from email body
     * @returns {Promise<Task>} - a task if found, otherwise null
     */
    getTaskByRefNr(logger: Workfront.Logger, refNr: string, fields?: string | string[]): Promise<WfModel.Task>;
    /**
     * Update existing task as a user with provided email.
     *
     * @param logger - logger object (for later debugging in case of errors happen in processing)
     * @param fromEmail - update task as a user with this email
     * @param taskId - task id to update
     * @param updates - update fields on task
     * @returns {Promise<Task>|Promise} - update task
     */
    updateTaskAsUser(logger: Workfront.Logger, fromEmail: mailparser.EmailAddress, taskId: string, updates: Object): Promise<WfModel.Task>;
    /**
     * Query for team members
     */
    getTeamMembers(logger: Workfront.Logger, teamId: string, fields?: string[]): Promise<WfModel.TeamMember[]>;
    /**
     * Find DocV corresponding journal entry
     */
    findDocVJournalEntry(logger: Workfront.Logger, docv: WfModel.DocumentVersion, fieldsToReturn?: string | string[]): Promise<WfModel.JournalEntry>;
    /**
     */
    uploadPdfDocumentAsUser(logger: Workfront.Logger, fromEmail: mailparser.EmailAddress, parentRef: WfModel.WfObject, buffer: Buffer | string, fileName: string, docFolder: WfModel.DocumentFolder, docFieldsToReturn: string[]): Promise<WfModel.Document>;
    /**
     * Download a document under a provided user
     *
     * @param logger - logger object (for later debugging in case of errors happen in processing)
     * @param ownerUsername - document is downloaded with this user session
     * @param downloadUrl - a document Url
     * @param output - a writeable stream to save the document
     * @returns {Promise<void>|Promise}
     */
    downloadAsUser(logger: Workfront.Logger, ownerUsername: string, downloadURL: string, output: NodeJS.WritableStream): Promise<void>;
    /**
     * Remove an entity from Workfront under a specified user
     *
     * @param {Workfront.Logger} logger
     * @param {mailparser.EmailAddress} from
     * @param {WfModel.WfObject} entityRef
     * @returns {Promise<WfModel.WfObject>}
     */
    removeAsUser(logger: Workfront.Logger, from: mailparser.EmailAddress, entityRef: WfModel.WfObject, bForce?: boolean): Promise<WfModel.WfObject>;
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
        getSession(email: string): api.LoginResult;
        /**
         * Set existing user session for user login email / username
         *
         * @param email - user login email / username
         * @param login session
         */
        setSession(email: string, login: api.LoginResult): void;
        /**
         * Return all the login sessions
         */
        getSessions(): Map<string, api.LoginResult>;
    }
    export import WfError = WfModel.WfError;
    export import WfObject = WfModel.WfObject;
    export import UploadHandle = WfModel.UploadHandle;
    export import Project = WfModel.Project;
    export import Portfolio = WfModel.Portfolio;
    export import Program = WfModel.Program;
    export import User = WfModel.User;
    export import Company = WfModel.Company;
    export import Document = WfModel.Document;
    export import DocumentVersion = WfModel.DocumentVersion;
    export import DocumentFolder = WfModel.DocumentFolder;
    export import DocumentFolderParentField = WfModel.DocumentFolderParentField;
    export import DocumentApproval = WfModel.DocumentApproval;
    export import AssignUserToken = WfModel.AssignUserToken;
    export import CompleteUserRegistration = WfModel.CompleteUserRegistration;
    export import Note = WfModel.Note;
    export import RichTextNote = WfModel.RichTextNote;
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
    export import ApproverStatus = WfModel.ApproverStatus;
    export import ApprovalStage = WfModel.ApprovalStage;
    export import StepApprover = WfModel.StepApprover;
    export import ApprovalPath = WfModel.ApprovalPath;
    export import ApprovalProcess = WfModel.ApprovalProcess;
    export import Subscribe = WfModel.Subscribe;
    interface WfConnError {
        active: boolean;
        errorDate: moment.Moment;
    }
    interface Upload {
        attachments: mailparser.Attachment[];
        handles: UploadHandle[];
    }
}
