export declare namespace WfModel {
    interface WfError {
        error: string;
        "class": string;
        message: string;
        title: string;
        msgKey: string;
        attributes: Array<string>;
        code: number;
    }
    interface WfObject {
        objCode: string;
        ID: string;
        name?: string;
    }
    interface Project {
        objCode: string;
        ID: string;
        name: string;
        categoryID: string;
        enteredBy: User;
        owner: User;
        sponsor: User;
        referenceNumber: number;
        accessRules: AccessRule[];
    }
    interface User {
        ID: string;
        objCode: string;
        name: string;
        firstName: string;
        lastName: string;
        username: string;
        emailAddr: string;
        phoneNumber: string;
        title: string;
        password: string;
        companyID: string;
    }
    interface Document {
        ID: string;
        name: string;
        description: string;
        lastUpdateDate: string;
        docObjCode: string;
        objID: string;
        topDocObjCode: string;
        topObjID: string;
        isDir: boolean;
        isPrivate: boolean;
        isPublic: boolean;
        extRefID: string;
        downloadURL: string;
        folderIDs: string[];
        userID: string;
        ownerID: string;
        owner: User;
        lastVersionNum: string;
        currentVersion: DocumentVersion;
    }
    interface DocumentVersion {
        ID: string;
        objCode: string;
        entryDate: string;
        docSize: number;
        docStatus: number;
        documentID: string;
        documentProviderID: string;
        enteredByID: string;
        ext: string;
        extRefID: string;
        externalDownloadURL: string;
        externalIntegrationType: string;
        externalSaveLocation: string;
        fileName: string;
        fileType: string;
        version: string;
        handle: string;
        location: string;
        enteredBy: User;
        document: Document;
        jrnle: JournalEntry;
        millisPassed: number;
        isNewVersion: boolean;
    }
    interface DocumentFolder {
        ID: string;
        objCode: string;
        name: string;
        enteredBy: User;
        entryDate: string;
        userID: string;
        parentID: string;
        issueID: string;
        taskID: string;
        projectID: string;
        linkedFolderID: string;
        folderParentField?: DocumentFolderParentField;
    }
    class DocumentFolderParentField {
        name: string;
        value: string;
        constructor(name: string, value: string);
    }
    interface AssignUserToken {
        result: string;
    }
    interface CompleteUserRegistration {
        result: string;
    }
    interface Note extends WfObject {
        ID: string;
        objCode: string;
        extRefID: string;
        ownerID?: string;
        objID?: string;
        auditType?: string;
        entryDate?: string;
        noteText?: string;
        subject?: string;
        emailUsers?: string;
        threadID?: string;
        opTaskID?: string;
        noteObjCode?: string;
        topNoteObjCode?: string;
        topObjID?: string;
        parentNoteID?: string;
        parentJournalEntryID?: string;
        projectID?: string;
        taskID?: string;
        referenceObjectName?: string;
        topReferenceObjectName?: string;
        isMessage?: boolean;
        isPrivate: boolean;
        hasReplies?: boolean;
        isReply?: boolean;
        numReplies: number;
        attachDocumentID: string;
        attachObjCode: string;
        attachObjID: string;
        owner?: User;
        tags?: NoteTag[];
        replies?: Note[];
        secondsPassed: number;
        uniqueId: string;
    }
    interface JournalEntry {
        ID: string;
        extRefID: string;
        entryDate: string;
        objObjCode: string;
        objID: string;
        subObjCode: string;
        subObjID: string;
        topObjCode: string;
        topObjID: string;
        userID: string;
        opTaskID: string;
        projectID: string;
        taskID: string;
        numReplies: number;
        auditRecordID: string;
        editedByID: string;
        editedBy: User;
        user: User;
        replies?: Note[];
        document?: Document;
        secondsPassed: number;
    }
    interface NoteTag {
        ID: string;
        objCode: string;
        customerID: string;
        length: number;
        noteID: string;
        objID: string;
        objObjCode: string;
        startIdx: number;
        teamID: string;
        userID: string;
    }
    interface Team {
        ID: string;
        name: string;
        teamMembers: TeamMember[];
    }
    interface TeamMember {
        customerID: string;
        teamID: string;
        userID: string;
    }
    class Issue {
        static EXT_MSG_PREFIX: string;
        ID: string;
        objCode: string;
        name: string;
        plannedCompletionDate: string;
        status: string;
        referenceNumber: number;
        categoryID: string;
        ownerID: string;
        owner: User;
        projectID: string;
        description: string;
        isHelpDesk: boolean;
        opTaskType: string;
        enteredByID: string;
        extRefID: string;
        assignedToID: string;
        teamID: string;
        accessRules: AccessRule[];
    }
    class ReplyMessage {
        textMsg: string;
        threadID: string;
        parentObjType: string;
        parentObjId: string;
        isReply: boolean;
        parentJournalEntryID: string;
        extRefID: string;
    }
    class IssueUpdate {
        projectID: string;
        name: string;
        description: string;
        enteredByID: string;
        ownerID: string;
    }
    interface Task {
        ID: string;
        objCode: string;
        name: string;
        referenceNumber: number;
        plannedStartDate: string;
        status: string;
        percentComplete: number;
        commitDate: string;
        accessRules: AccessRule[];
    }
    interface AccessRule {
        ID: string;
        objCode: string;
        coreAction: string;
        customerID: string;
        forbiddenActions: string[];
        secondaryActions: string[];
        isInherited: boolean;
        accessorObjCode: string;
        accessorID: string;
        securityObjCode: string;
        securityObjID: string;
        ancestorID: string;
        ancestorObjCode: string;
    }
    interface MetaData {
        name: string;
        label: string;
        objCode: string;
        flags: string[];
        url: string;
        fields: any;
        collections: any;
        search: any;
        custom: any;
        queries: any;
        operations: string[];
    }
}
