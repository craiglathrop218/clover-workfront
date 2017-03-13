
export namespace WfModel {
    export interface WfError {error: string, "class": string, message: string, title: string, msgKey: string, attributes: Array<string>, code: number};
    export interface WfObject {
        objCode: string,
        ID: string,
        name?: string
    };

    export interface Project {
        objCode: string,
        ID: string,
        name: string,
        categoryID: string;
        enteredBy: User,
        owner: User;
        sponsor: User;
        referenceNumber: number;
        accessRules: AccessRule[];
    }

    export interface User {
        ID: string,
        objCode: string,
        name: string,
        firstName: string,
        lastName: string,
        username: string,
        emailAddr: string,
        phoneNumber: string,
        title: string,
        password: string,
        companyID: string
    }

    export interface Document {
        ID: string,
        name: string, // Document name
        description: string,
        lastUpdateDate: string,
        docObjCode: string, // parent object code this Document was attached to (Issue, Task, etc.)
        objID: string, // parent object id this document was attached to
        topDocObjCode: string,
        topObjID: string,
        isDir: boolean,
        isPrivate: boolean,
        isPublic: boolean,
        extRefID: string,
        downloadURL: string,
        folderIDs: string[], // write-only field, a reference to a folder(s) where to put a new document
        userID: string,
        ownerID: string,
        owner: User,
        lastVersionNum: string,
        currentVersion: DocumentVersion
    }
    export interface DocumentVersion {
        ID: string,
        objCode: string,
        entryDate: string,
        docSize: number,
        docStatus: number,
        documentID: string,
        documentProviderID: string,
        enteredByID: string,
        ext: string,
        extRefID: string,
        externalDownloadURL: string,
        externalIntegrationType: string,
        externalSaveLocation: string,
        fileName: string,
        fileType: string,
        version: string,
        handle: string,
        location: string,
        enteredBy: User,
        document: Document,
        // NB! CUSTOM FIELDS BELOW! These fields below does not exist in Workfront - custom fields added for internal processing
        jrnle: JournalEntry,
        millisPassed: number,
        isNewVersion: boolean
    }

    export interface DocumentFolder {
        ID: string,
        objCode: string,
        name: string, // Document folder name
        enteredBy: User,
        entryDate: string,
        userID: string,
        parentID: string,
        issueID: string, // folder under an issue
        taskID: string, // folder under a task
        projectID: string, // folder under a project
        linkedFolderID: string,
        // NB! CUSTOM FIELDS BELOW! These fields below does not exist in Workfront - custom fields added for internal processing
        folderParentField?: DocumentFolderParentField
    }
    // This is just a meta data entity to hold document folder parent entity field name and value
    export class DocumentFolderParentField {
        public name: string;
        public value: string;
        constructor(name: string, value: string) {
            this.name = name;
            this.value = value;
        }
    }

    export interface AssignUserToken {result: string};
    export interface CompleteUserRegistration {result: string}

    export interface Note extends WfObject {
        ID: string,
        objCode: string,
        extRefID: string,
        ownerID?: string
        objID?: string,
        auditType?: string,
        entryDate?: string,
        noteText?: string,
        subject?: string,
        emailUsers?: string,
        threadID?: string,
        opTaskID?: string,
        noteObjCode?: string,
        topNoteObjCode?: string,
        topObjID?: string,
        parentNoteID?: string,
        parentJournalEntryID?: string,
        projectID?: string,
        taskID?: string,
        referenceObjectName?: string,
        topReferenceObjectName?: string,
        isMessage?: boolean,
        isPrivate: boolean,
        hasReplies?: boolean,
        isReply?: boolean,
        numReplies: number,
        attachDocumentID: string,
        attachObjCode: string,
        attachObjID: string,
        // References & Collections
        owner?: User,
        tags?: NoteTag[],
        replies?: Note[],
        // NB! CUSTOM FIELDS BELOW! These fields below does not exist in Workfront - custom fields added for internal processing
        // isUpdate: boolean,
        secondsPassed: number,
        uniqueId: string
    }

    export interface JournalEntry {
        ID: string,
        extRefID: string,
        entryDate: string,
        objObjCode: string,
        objID: string,
        subObjCode: string,
        subObjID: string,
        topObjCode: string,
        topObjID: string,
        userID: string
        opTaskID: string,
        projectID: string,
        taskID: string,
        numReplies: number
        auditRecordID: string,
        editedByID: string,
        // References & Collections
        editedBy: User,
        user: User,
        replies?: Note[],
        document?: Document,
        // NB! CUSTOM FIELDS BELOW! These fields below does not exist in Workfront - custom fields added for internal processing
        secondsPassed: number
    }
    export interface NoteTag {
        ID: string,
        objCode: string, // NTAG
        customerID: string,
        length: number,
        noteID: string,
        objID: string,
        objObjCode: string, // USER - if tag references a User, then "objID" is a reference to User ID
        startIdx: number,
        teamID: string,
        userID: string // exists if tag is a reference to User
    }

    export interface Team {
        ID: string,
        name: string,
        teamMembers: TeamMember[]
    }
    export interface TeamMember {
        customerID: string,
        teamID: string,
        userID: string
    }
    export class Issue {
        static EXT_MSG_PREFIX: string = "FROM_EMAIL.MESSAGE_ID:";
        // data fields
        public ID: string;
        public objCode: string;
        public name: string;
        public plannedCompletionDate: string;
        public status: string;
        public referenceNumber: number;
        public categoryID: string;
        public ownerID: string;
        public owner: User;
        public projectID: string;
        public description: string;
        public isHelpDesk: boolean;
        public opTaskType: string; // with enum values
        public enteredByID: string;
        public extRefID: string;
        public assignedToID: string;
        public teamID: string;
        public accessRules: AccessRule[];
    }
    export class ReplyMessage {
        textMsg: string;
        threadID: string;
        parentObjType: string;
        parentObjId: string;
        isReply: boolean = false;
        parentJournalEntryID: string;
        extRefID: string;
    }

    export class IssueUpdate {
        public projectID: string;
        // public queueTopicID: string;
        public name: string;
        public description: string;
        public enteredByID: string;
        public ownerID: string;
    }

    export interface Task {
        ID: string,
        objCode: string
        name: string;
        referenceNumber: number;
        plannedStartDate: string;
        status: string;
        percentComplete: number;
        commitDate: string;
        accessRules: AccessRule[];
    }

    // Share objects
    export interface AccessRule {
        ID: string,
        objCode: string,
        coreAction: string, // LIMITED_EDIT, VIEW, DELETE, etc.
        customerID: string,
        forbiddenActions: string[],
        secondaryActions: string[],
        isInherited: boolean,
        accessorObjCode: string,
        accessorID: string,
        securityObjCode: string,
        securityObjID: string,
        ancestorID: string,
        ancestorObjCode: string
    }

    export interface MetaData {
        name: string,
        label: string,
        objCode: string,
        flags: string[],
        url: string,
        fields: any,
        collections: any,
        search: any,
        custom: any,
        queries: any,
        operations: string[]
    }
}
