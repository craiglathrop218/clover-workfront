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
        objCode?: string;
        ID?: string;
        name?: string;
    }
    interface UploadHandle {
        handle: string;
    }
    interface Project {
        objCode?: string;
        ID?: string;
        name?: string;
        description?: string;
        status?: string;
        condition?: string;
        conditionType?: string;
        priority?: number;
        categoryID?: string;
        extRefID?: string;
        enteredBy?: User;
        owner?: User;
        sponsor?: User;
        referenceNumber?: number;
        accessRules?: AccessRule[];
        objectCategories?: ObjectCategory[];
        portfolioID?: string;
        percentComplete?: number;
        plannedStartDate?: string;
        projectedStartDate?: string;
        approvalStartDate?: string;
        approvalCompletionDate?: string;
        currentApprovalStepID?: string;
        portfolio?: Portfolio;
        approverStatuses?: ApproverStatus[];
        subscribes?: Subscribe[];
    }
    interface Portfolio {
        objCode: string;
        ID: string;
        name: string;
        accessorIDs: string[];
        aligned: number;
        alignmentScoreCardID: string;
        budget: number;
        categoryID: string;
        currency: number;
        customerID: string;
        description: string;
        enteredByID: string;
        entryDate: string;
        extRefID: string;
        hasDocuments: boolean;
        hasMessages: boolean;
        hasNotes: boolean;
        isActive: boolean;
        lastUpdateDate: string;
        lastUpdatedByID: string;
        netValue: number;
        onBudget: number;
        onTime: number;
        ownerID: string;
        roi: number;
        category: Category;
        enteredBy: User;
        lastUpdatedBy: User;
        owner: User;
        programs: Program[];
        projects: Project[];
    }
    interface Program {
        objCode: string;
        ID: string;
        name: string;
    }
    interface ObjectCategory {
        objCode: string;
        ID: string;
        category: Category;
    }
    interface Category {
        objCode: string;
        ID: string;
        name: string;
        catObjCode: string;
        parameterGroup: string;
        enteredByID: string;
        extRefID: string;
        groupID: string;
        hasCalculatedFields: boolean;
        lastUpdateDate: string;
        lastUpdatedByID: string;
        otherGroups: Group[];
        categoryParameters: CategoryParameter[];
    }
    interface CategoryParameter {
        objCode: string;
        categoryID: string;
        customerID: string;
        displayOrder: number;
        isInvalidExpression: boolean;
        isRequired: boolean;
        parameterGroupID: string;
        parameterID: string;
        rowShared: boolean;
        securityLevel: string;
        viewSecurityLevel: string;
        parameter: Parameter;
        parameterGroup: ParameterGroup;
    }
    interface Parameter {
        objCode: string;
        ID: string;
        name: string;
        extRefID: string;
        customerID: string;
        parameterOptions: ParameterOption[];
        description: string;
        dataType: string;
        displaySize: number;
        displayType: string;
        formatConstraint: string;
        isRequired: boolean;
        lastUpdateDate: string;
        lastUpdatedByID: string;
        parameterDescriptiveText?: ParameterDescriptiveText;
    }
    interface ParameterOption {
        objCode: string;
        ID: string;
        customerID: string;
        extRefID: string;
        displayOrder: number;
        isDefault: boolean;
        isHidden: boolean;
        parameterID: string;
        label: string;
        value: string;
    }
    interface ParameterDescriptiveText {
        customerID: string;
        parameterID: string;
        text: string;
        url: string;
    }
    interface ParameterGroup {
        objCode: string;
        ID: string;
        name: string;
        extRefID: string;
        customerID: string;
        description: string;
        displayOrder: number;
        isDefault: boolean;
        lastUpdateDate: string;
        lastUpdatedByID: string;
    }
    interface Group {
        objCode: string;
        ID: string;
        name: string;
        customerID: string;
        description: string;
        enteredByID: string;
        entryDate: string;
        extRefID: string;
        parentID: string;
    }
    interface User {
        ID?: string;
        objCode?: string;
        name?: string;
        firstName?: string;
        lastName?: string;
        username?: string;
        emailAddr?: string;
        phoneNumber?: string;
        title?: string;
        password?: string;
        companyID?: string;
        company?: Company;
    }
    interface Company {
        ID?: string;
        objCode?: string;
        isPrimary?: boolean;
        name?: string;
    }
    interface Document {
        ID?: string;
        objCode?: string;
        name: string;
        description?: string;
        lastUpdateDate?: string;
        docObjCode: string;
        objID: string;
        topDocObjCode?: string;
        topObjID?: string;
        isDir?: boolean;
        isPrivate?: boolean;
        isPublic?: boolean;
        extRefID?: string;
        projectID?: string;
        downloadURL?: string;
        folderIDs?: string[];
        userID?: string;
        ownerID?: string;
        owner?: User;
        lastVersionNum?: string;
        currentVersionID?: string;
        currentVersion?: DocumentVersion;
        handle?: string;
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
    interface DocumentApproval {
        ID?: string;
        objCode?: string;
        approvalDate?: string;
        approverID?: string;
        autoDocumentShareID?: string;
        customerID?: string;
        documentID?: string;
        noteID?: string;
        requestDate?: string;
        requestorID?: string;
        status?: string;
        approver?: User;
        document?: Document;
        note?: Note;
        requestor?: User;
    }
    interface AssignUserToken {
        result: string;
    }
    interface CompleteUserRegistration {
        result: string;
    }
    interface Note extends WfObject {
        ID?: string;
        objCode?: string;
        extRefID?: string;
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
        isPrivate?: boolean;
        hasReplies?: boolean;
        isReply?: boolean;
        numReplies?: number;
        attachDocumentID?: string;
        attachObjCode?: string;
        attachObjID?: string;
        portfolioID?: string;
        documentID?: string;
        programID?: string;
        templateID?: string;
        templateTaskID?: string;
        parentJournalEntry?: JournalEntry;
        parentNote?: Note;
        document?: Document;
        owner?: User;
        tags?: NoteTag[];
        replies?: Note[];
        richTextNote?: RichTextNote;
        secondsPassed?: number;
        uniqueId?: string;
    }
    interface RichTextNote extends WfObject {
        ID?: string;
        objCode?: string;
        html?: string;
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
        ID?: string;
        objCode?: string;
        customerID?: string;
        length?: number;
        noteID?: string;
        objID?: string;
        objObjCode?: string;
        referenceObjectName?: string;
        startIdx?: number;
        teamID?: string;
        userID?: string;
        note?: Note;
        user?: User;
        team?: Team;
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
        team: Team;
        user: User;
    }
    class Issue {
        static EXT_MSG_PREFIX: string;
        ID: string;
        objCode: string;
        name: string;
        entryDate: string;
        plannedCompletionDate: string;
        approvalStartDate: string;
        approvalCompletionDate: string;
        currentApprovalStepID: string;
        status: string;
        referenceNumber: number;
        categoryID: string;
        ownerID: string;
        owner: User;
        projectID: string;
        description: string;
        isHelpDesk: boolean;
        opTaskType: string;
        priority: number;
        enteredByID: string;
        extRefID: string;
        assignedToID: string;
        teamID: string;
        accessRules: AccessRule[];
        approverStatuses?: ApproverStatus[];
        subscribes?: Subscribe[];
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
        ID?: string;
        objCode?: string;
        name?: string;
        referenceNumber?: number;
        plannedStartDate?: string;
        plannedCompletionDate?: string;
        actualCompletionDate?: string;
        actualStartDate?: string;
        approvalStartDate?: string;
        approvalCompletionDate?: string;
        currentApprovalStepID?: string;
        status?: string;
        percentComplete?: number;
        commitDate?: string;
        milestoneID?: string;
        extRefID?: string;
        projectID?: string;
        milestone?: Milestone;
        accessRules?: AccessRule[];
        enteredBy?: User;
        assignedTo?: User;
        assignments?: Assignment[];
        defaultBaselineTask?: BaselineTask;
        parentID?: string;
        parent?: Task;
        approverStatuses?: ApproverStatus[];
        subscribes?: Subscribe[];
    }
    interface Milestone {
        ID: string;
        objCode: string;
        name: string;
        color: string;
        description: string;
        extRefID: string;
        milestonePathID: string;
        milestonePath: MilestonePath;
        sequence: number;
    }
    interface MilestonePath {
        ID: string;
        objCode: string;
        name: string;
        description: string;
        enteredByID: string;
        entryDate: string;
        extRefID: string;
    }
    interface Assignment {
        ID: string;
        objCode: string;
        actualWorkCompleted: number;
        actualWorkPerDayStartDate: string;
        assignedByID: string;
        assignedToID: string;
        assignmentPercent: number;
        avgWorkPerDay: number;
        customerID: string;
        feedbackStatus: string;
        isPrimary: boolean;
        isTeamAssignment: boolean;
        opTaskID: string;
        plannedUserAllocationPercentage: number;
        projectID: string;
        projectedAvgWorkPerDay: number;
        projectedUserAllocationPercentage: number;
        roleID: string;
        status: string;
        taskID: string;
        teamID: string;
        work: number;
        workRequired: number;
        assignedBy: User;
        assignedTo: User;
        opTask: Issue;
        project: Project;
        role: Role;
        task: Task;
        team: Team;
    }
    interface Role {
        ID: string;
        objCode: string;
        billingPerHour: number;
        costPerHour: number;
        customerID: string;
        defaultInterface: number;
        description: string;
        enteredByID: string;
        entryDate: string;
        extRefID: string;
        layoutTemplateID: string;
        maxUsers: number;
        name: string;
        enteredBy: User;
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
    interface BaselineTask {
        ID: string;
        objCode: string;
        actualCompletionDate: string;
        actualCost: number;
        actualDurationMinutes: number;
        actualStartDate: string;
        actualWorkRequired: number;
        baselineID: string;
        cpi: number;
        csi: number;
        customerID: string;
        durationMinutes: number;
        durationUnit: string;
        eac: number;
        entryDate: string;
        estCompletionDate: string;
        estStartDate: string;
        isDefault: boolean;
        name: string;
        percentComplete: number;
        plannedCompletionDate: string;
        plannedCost: number;
        plannedStartDate: string;
        progressStatus: string;
        projectedCompletionDate: string;
        projectedStartDate: string;
        spi: number;
        taskID: string;
        workRequired: number;
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
    interface CustomEnum {
        ID: string;
        objCode: string;
        color: string;
        label: string;
        description: string;
        customerID: string;
        enumClass: string;
        extRefID: string;
        isPrimary: boolean;
        value: string;
        valueAsInt: number;
        valueAsString: string;
    }
    interface ApproverStatus extends WfObject {
        approvableObjCode?: string;
        approvableObjID?: string;
        approvalStepID?: string;
        approvedByID?: string;
        customerID?: string;
        delegateUserID?: string;
        isOverridden?: boolean;
        opTaskID?: string;
        overriddenUserID?: string;
        projectID?: string;
        status?: string;
        stepApproverID?: string;
        taskID?: string;
        wildcardUserID?: string;
        approvalStep?: ApprovalStage;
        approvedBy?: User;
        delegateUser?: User;
        opTask?: Issue;
        overriddenUser?: User;
        project?: Project;
        stepApprover?: StepApprover;
        task?: Task;
        wildcardUser?: User;
    }
    interface ApprovalStage extends WfObject {
        approvalPathID?: string;
        approvalType?: string;
        customerID?: string;
        name?: string;
        sequenceNumber?: number;
        approvalPath?: ApprovalPath;
        stepApprovers?: StepApprover[];
    }
    interface StepApprover extends WfObject {
        approvalStepID?: string;
        customerID?: string;
        roleID?: string;
        teamID?: string;
        userID?: string;
        wildCard?: string;
        approvalStep?: ApprovalStage;
        role?: Role;
        team?: Team;
        user?: User;
    }
    interface ApprovalPath extends WfObject {
        approvalProcessID?: string;
        approvedStatus?: string;
        approvedStatusLabel?: string;
        comment?: string;
        customerID?: string;
        durationMinutes?: number;
        durationUnit?: string;
        enteredByID?: string;
        entryDate?: string;
        globalPathID?: string;
        isPrivate?: boolean;
        lastUpdateDate?: string;
        lastUpdatedByID?: string;
        name?: string;
        rejectedStatus?: string;
        rejectedStatusLabel?: string;
        shouldCreateIssue?: boolean;
        targetStatus?: string;
        targetStatusLabel?: string;
        approvalProcess?: ApprovalProcess;
        approvalSteps?: ApprovalStage[];
    }
    interface ApprovalProcess extends WfObject {
        accessorIDs?: string[];
        approvalObjCode?: string;
        approvalStatuses?: string[];
        customerID?: string;
        description?: string;
        durationMinutes?: number;
        enteredByID?: string;
        entryDate?: string;
        extRefID?: string;
        isPrivate?: boolean;
        lastUpdateDate?: string;
        lastUpdatedByID?: string;
        name?: string;
        securityRootID?: string;
        securityRootObjCode?: string;
        enteredBy?: User;
        lastUpdatedBy?: User;
        approvalPaths?: ApprovalPath[];
    }
    interface Subscribe extends WfObject {
        enteredByID?: string;
        customerID?: string;
        opTaskID?: string;
        projectID?: string;
        subscribeObjCode?: string;
        subscribeObjID?: string;
        subscribeTime?: string;
        subscriberID?: string;
        taskID?: string;
        enteredBy?: User;
        opTask?: Issue;
        project?: Project;
        subscriber?: User;
        task?: Task;
    }
    interface QueryCount {
        count: number;
    }
}
