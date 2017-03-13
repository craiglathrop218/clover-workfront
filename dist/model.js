"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var WfModel;
(function (WfModel) {
    ;
    ;
    // This is just a meta data entity to hold document folder parent entity field name and value
    var DocumentFolderParentField = (function () {
        function DocumentFolderParentField(name, value) {
            this.name = name;
            this.value = value;
        }
        return DocumentFolderParentField;
    }());
    WfModel.DocumentFolderParentField = DocumentFolderParentField;
    ;
    var Issue = (function () {
        function Issue() {
        }
        return Issue;
    }());
    Issue.EXT_MSG_PREFIX = "FROM_EMAIL.MESSAGE_ID:";
    WfModel.Issue = Issue;
    var ReplyMessage = (function () {
        function ReplyMessage() {
            this.isReply = false;
        }
        return ReplyMessage;
    }());
    WfModel.ReplyMessage = ReplyMessage;
    var IssueUpdate = (function () {
        function IssueUpdate() {
        }
        return IssueUpdate;
    }());
    WfModel.IssueUpdate = IssueUpdate;
})(WfModel = exports.WfModel || (exports.WfModel = {}));
