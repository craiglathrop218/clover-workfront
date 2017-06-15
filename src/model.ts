
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
        description: string;
        status: string;
        condition: string,
        conditionType: string,
        priority: number,
        categoryID: string;
        enteredBy: User,
        owner: User,
        sponsor: User,
        referenceNumber: number,
        accessRules: AccessRule[],
        objectCategories: ObjectCategory[],
        portfolioID: string,
        percentComplete: number;
        plannedStartDate: string;
        projectedStartDate: string;
        portfolio: Portfolio
    }

    export interface Portfolio {
        objCode: string,
        ID: string,
        name: string,
        accessorIDs: string[],
        aligned: number,
        alignmentScoreCardID: string,
        budget: number,
        categoryID: string,
        currency: number,
        customerID: string,
        description: string,
        enteredByID: string,
        entryDate: string,
        extRefID: string,
        hasDocuments: boolean,
        hasMessages: boolean,
        hasNotes: boolean,
        isActive: boolean,
        lastUpdateDate: string,
        lastUpdatedByID: string,
        netValue: number,
        onBudget: number,
        onTime: number,
        ownerID: string,
        roi: number,
        category: Category,
        //customer: Customer
        enteredBy: User,
        lastUpdatedBy: User,
        owner: User,
        programs: Program[],
        projects: Project[]
    }

    export interface Program {
        objCode: string,
        ID: string,
        name: string
    }

    export interface ObjectCategory {
        objCode: string,
        ID: string,
        category: Category
    }

    export interface Category {
        objCode: string,
        ID: string,
        name: string,
        catObjCode: string,
        parameterGroup: string,
        enteredByID: string,
        extRefID: string,
        groupID: string,
        hasCalculatedFields: boolean,
        lastUpdateDate: string,
        lastUpdatedByID: string,
        otherGroups: Group[],
        categoryParameters: CategoryParameter[],
    }

    export interface CategoryParameter {
        objCode: string,
        categoryID: string,
        customerID: string,
        displayOrder: number,
        isInvalidExpression: boolean,
        isRequired: boolean,
        parameterGroupID: string,
        parameterID: string,
        rowShared: boolean,
        securityLevel: string,
        viewSecurityLevel: string,
        parameter: Parameter,
        parameterGroup: ParameterGroup
    }

    export interface Parameter {
        objCode: string,
        ID: string,
        name: string,
        extRefID: string,
        customerID: string,
        parameterOptions: ParameterOption[],
        description: string,
        dataType: string, // DATE (Date), DTTM (Date/Time), NMBR (Number), CURC (Currency), TEXT (Text) etc.
        displaySize: number,
        displayType: string, // MULT (Multi-Select Drop Down), SLCT (Drop Down), CALC (Calculated), TEXT (Text Field), RDIO (Radio Buttons), CHCK (Checkboxes), TXTA (Text Area), PSWD (Password Field), DTXT (Descriptive Field) etc.
        formatConstraint: string,
        isRequired: boolean,
        lastUpdateDate: string,
        lastUpdatedByID: string,
        parameterDescriptiveText?: ParameterDescriptiveText
    }

    export interface ParameterOption {
        objCode: string,
        ID: string,
        customerID: string,
        extRefID: string,
        displayOrder: number,
        isDefault: boolean,
        isHidden: boolean,
        parameterID: string,
        label: string,
        value: string
    }

    export interface ParameterDescriptiveText {
        customerID: string,
        parameterID: string,
        text: string,
        url: string
    }

    export interface ParameterGroup {
        objCode: string,
        ID: string,
        name: string,
        extRefID: string,
        customerID: string,
        description: string,
        displayOrder: number,
        isDefault: boolean,
        lastUpdateDate: string,
        lastUpdatedByID: string
    }

    export interface Group {
        objCode: string,
        ID: string,
        name: string,
        customerID: string,
        description: string,
        enteredByID: string,
        entryDate: string,
        extRefID: string,
        parentID: string
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
        objCode: string,
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
        currentVersionID: string,
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

    export interface DocumentApproval {
        ID: string,
        objCode: string,
        approvalDate: string,
        approverID: string,
        autoDocumentShareID: string,
        customerID: string,
        documentID: string,
        noteID: string,
        requestDate: string,
        requestorID: string,
        status: string
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
        document?: Document,
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
        public entryDate: string;
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
        public priority: number;
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
        plannedCompletionDate: string;
        status: string;
        percentComplete: number;
        commitDate: string;
        milestoneID: string;
        milestone: Milestone;
        accessRules: AccessRule[];
        enteredBy: User; // user who created a task
        assignedTo: User; // user whom this task is assigned
        assignments?: Assignment[],
        defaultBaselineTask: BaselineTask
    }

    export interface Milestone {
        ID: string,
        objCode: string,
        name: string;
        color: string,
        description: string,
        extRefID: string,
        milestonePathID: string,
        milestonePath: MilestonePath,
        sequence: number
    }

    export interface MilestonePath {
        ID: string,
        objCode: string,
        name: string;
        description: string,
        enteredByID: string,
        entryDate: string,
        extRefID: string
    }

    export interface Assignment {
        ID: string,
        objCode: string,
        actualWorkCompleted: number,
        actualWorkPerDayStartDate: string,
        assignedByID: string,
        assignedToID: string,
        assignmentPercent: number,
        avgWorkPerDay: number,
        customerID: string,
        feedbackStatus: string,
        isPrimary: boolean,
        isTeamAssignment: boolean,
        opTaskID: string,
        plannedUserAllocationPercentage: number,
        projectID: string,
        projectedAvgWorkPerDay: number,
        projectedUserAllocationPercentage: number,
        roleID: string,
        status: string,
        taskID: string,
        teamID: string,
        work: number,
        workRequired: number,
        assignedBy: User,
        assignedTo: User,
        //customer: Customer,
        opTask: Issue,
        project: Project,
        role: Role, // job role
        task: Task,
        team: Team,
        // workItem: WorkItem
    }

    export interface Role {
        ID: string,
        objCode: string,
        billingPerHour: number,
        costPerHour: number,
        customerID: string,
        defaultInterface: number,
        description: string,
        enteredByID: string,
        entryDate: string,
        extRefID: string,
        layoutTemplateID: string,
        maxUsers: number,
        name: string,
        enteredBy: User
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

    export interface BaselineTask {
        ID: string,
        objCode: string,
        actualCompletionDate: string,
        actualCost: number,
        actualDurationMinutes: number,
        actualStartDate: string,
        actualWorkRequired: number,
        baselineID: string,
        cpi: number,
        csi: number,
        customerID: string,
        durationMinutes: number,
        durationUnit: string,
        eac: number,
        entryDate: string,
        estCompletionDate: string,
        estStartDate: string,
        isDefault: boolean,
        name: string,
        percentComplete: number,
        plannedCompletionDate: string,
        plannedCost: number,
        plannedStartDate: string,
        progressStatus: string,
        projectedCompletionDate: string,
        projectedStartDate: string,
        spi: number,
        taskID: string,
        workRequired: number
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

    export interface CustomEnum {
        ID: string,
        objCode: string,
        color: string,
        label: string,
        description: string,
        customerID: string,
        enumClass: string,
        extRefID: string,
        isPrimary: boolean,
        value: string,
        valueAsInt: number,
        valueAsString: string
    }

    export interface QueryCount {
        count: number;
    }
}
