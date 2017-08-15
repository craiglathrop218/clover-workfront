"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var WfModel;
(function (WfModel) {
    ;
    ;
    // This is just a meta data entity to hold document folder parent entity field name and value
    class DocumentFolderParentField {
        constructor(name, value) {
            this.name = name;
            this.value = value;
        }
    }
    WfModel.DocumentFolderParentField = DocumentFolderParentField;
    ;
    class Issue {
    }
    Issue.EXT_MSG_PREFIX = "FROM_EMAIL.MESSAGE_ID:";
    WfModel.Issue = Issue;
    class ReplyMessage {
        constructor() {
            this.isReply = false;
        }
    }
    WfModel.ReplyMessage = ReplyMessage;
    class IssueUpdate {
    }
    WfModel.IssueUpdate = IssueUpdate;
})(WfModel = exports.WfModel || (exports.WfModel = {}));
