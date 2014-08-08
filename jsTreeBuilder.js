/*
 * Copyright (c) 2014 zzxx53@GitHub
 * Some rights reserved 
 * Released under MIT license
 * See https://github.com/zzxx53/Draggble-JS-Query-Builder for documentation and updates 
 */

function QueryTreeBuilder(containerID, fieldsDict) {
    var root;
    if (typeof containerID === "string"){
        this.rootID = containerID;
        root=$('#' + containerID);
    } else {
        this.rootID=containerID.attr('id');
        root=containerID;
    }
    root.html('<ul class="tree"><li id="dndjqb_root" class="dndjqb_group dndjqb_droppable">Root&emsp;&emsp;<button class="dndjqb_add">Add Node</button><button class="dndjqb_addGroup">Add Group</button><ul></ul></li></ul>');
    this.fields = fieldsDict;
    this.setButtonEvents();
}
QueryTreeBuilder.prototype = {
    fieldDropdownString: "",
    queryObj: {},
    fields: {},
    ops: {
        text: {"equals":"==", "begins with":"%=", "ends with":"=%", "contains":"%=%"},
        numeric: {"equals":"==", "gt":">", "lt":"<", "ge":">=", "le":"<="},
        select: {"equals":"=="}
    },
    buttonString: '<button class="dndjqb_add">Add Node</button><button class="dndjqb_addGroup">Add Group</button><button class="dndjqb_remove">Remove Node</button>',
    andOrDropdownString: '<li class="dndjqb_AndOr"><select><option>AND</option><option>OR</option></select></li>',
    negatedCheckboxString: 'Negated? <span class="dndjqb_negation"><input type="checkbox" class="dndjqb_neg"></span>',
    objOnDrag: null,
    opsDropdown: {},
    buildOpsDropdown: function(type) {
        this.opsDropdown[type] = '<select class="dndjqb_opsDropdown">';
        var operators=Object.keys(this.ops[type]);
        for (var i = 0; i < operators.length; i++) {
            this.opsDropdown[type] += "<option>" + operators[i] + "</option>";
        }
        this.opsDropdown[type] += "</select>";
    },
    selectDropdown: {},
    buildSelectDropdown: function(selectID) {
        this.selectDropdown[selectID] = '<select class="dndjqb_value">';
        for (var i = 0; i < this.fields[selectID].values.length; i++) {
            this.selectDropdown[selectID] += "<option>" + this.fields[selectID].values[i] + "</option>";
        }
        this.selectDropdown[selectID] += "</select>";
    },
    buildFieldDropdown: function(parentObj) {
        var fieldNames = Object.keys(this.fields);
        var dropdownText = '<select class="dndjqb_FieldDropdown">';
        if (this.fieldDropdownString === "") {
            for (var i = 0; i < fieldNames.length; i++) {
                this.fieldDropdownString += "<option>" + fieldNames[i] + "</option>";
            }
        }
        dropdownText += this.fieldDropdownString;
        dropdownText += "</select>";
        var inserted = $(dropdownText);
        parentObj.append(inserted);
        var self = this;
        inserted.change(function() {
            var fieldName = $(this).val();
            if (!self.opsDropdown[self.fields[fieldName].type]) {
                self.buildOpsDropdown(self.fields[fieldName].type);
            }
            $(this).siblings("span.dndjqb_opsField").html(self.opsDropdown[self.fields[fieldName].type]);
            if (self.fields[fieldName].type === "select") {
                if (!self.selectDropdown[fieldName]) {
                    self.buildSelectDropdown(fieldName);
                }
                $(this).siblings("span.dndjqb_valueField").html(self.selectDropdown[fieldName]);
            } else {
                $(this).siblings("span.dndjqb_valueField").html('<input class="dndjqb_value" />');
            }
        });
    },
    buildCriteriaRow: function(parentObj, childIndex,rowData) {
        var inserted = $('<li class="dndjqb_criteria dndjqb_draggable dndjqb_droppable" draggable="true">Criteria&emsp;&emsp;</li>');
        inserted.append(this.negatedCheckboxString + '&emsp;');
        if (childIndex === undefined) {
            parentObj.append(inserted);
        } else {
            $(parentObj.children('li.dndjqb_criteria')[childIndex]).after(inserted);
        }
        this.buildFieldDropdown(inserted);
        inserted.append("<span class='dndjqb_opsField'></span><span class='dndjqb_valueField'></span>&emsp;");
        inserted.append(this.buttonString);
        if (inserted.prev('li.dndjqb_criteria,li.dndjqb_group').length) {
            this.buildAndOrRow(inserted);
        }
        inserted.children('select.dndjqb_FieldDropdown').change();
        this.setButtonEvents();
        this.setDragDropEvents();
        if (rowData!= undefined){
            inserted.children('select.dndjqb_FieldDropdown').val(rowData.fieldName);
            inserted.children('select.dndjqb_FieldDropdown').change();
            inserted.children('span.dndjqb_opsField').children('select.dndjqb_opsDropdown').val(rowData.op);
            inserted.children('span.dndjqb_valueField').children('.dndjqb_value').val(rowData.value);
            if (rowData.negated){
                inserted.children('span.dndjqb_negation').children('input.dndjqb_neg').prop('checked',true);
            }
            if (rowData.connector !=null){
                inserted.prev("li.dndjqb_AndOr").children('select').val(rowData.connector);
            }
        }
    },
    buildAndOrRow: function(criteriaRowObj) {
        criteriaRowObj.before(this.andOrDropdownString);
    },
    buildGroupRow: function(parentObj, childIndex,rowData) {
        var inserted = $('<li class="dndjqb_group dndjqb_draggable dndjqb_droppable" draggable="true">Criteria Group&emsp;&emsp;' + this.negatedCheckboxString + '&emsp;' + this.buttonString + "<ul></ul></li>");
        if (childIndex === undefined) {
            parentObj.append(inserted);
        } else {
            $(parentObj.children('li.dndjqb_criteria')[childIndex]).after(inserted);
        }
        if (inserted.prev('li.dndjqb_criteria,li.dndjqb_group').length) {
            this.buildAndOrRow(inserted);
        }
        this.setButtonEvents();
        this.setDragDropEvents();
        if (rowData!= undefined){
            if (rowData.negated){
                inserted.children('span.dndjqb_negation').children('input.dndjqb_neg').prop('checked',true);
            }
            if (rowData.connector !=null){
                inserted.prev("li.dndjqb_AndOr").children('select').val(rowData.connector);
            }
        }
    },
    setButtonEvents: function() {
        var self = this;
        $(".dndjqb_add").off('click').click(function() {
            if ($(this).closest('li').hasClass('dndjqb_criteria')) {
                var thisLI = $(this).closest('li');
                var parent = thisLI.parent('ul');
                self.buildCriteriaRow(parent, parent.children('li.dndjqb_criteria').index(thisLI));
            } else if ($(this).closest('li').hasClass('dndjqb_group')) {
                self.buildCriteriaRow($(this).siblings('ul'));
            }
        });
        $(".dndjqb_addGroup").off('click').click(function() {
            if ($(this).closest('li').hasClass('dndjqb_criteria')) {
                var thisLI = $(this).closest('li');
                var parent = thisLI.parent('ul');
                self.buildGroupRow(parent, parent.children('li.dndjqb_criteria').index(thisLI));
            } else if ($(this).closest('li').hasClass('dndjqb_group')) {
                self.buildGroupRow($(this).siblings('ul'));
            }
        });
        $(".dndjqb_remove").off('click').click(function() {
            var thisLI = $(this).closest("li");
            var parent = thisLI.parent('ul');
            thisLI.prev("li.dndjqb_AndOr").remove();
            if (parent.children('li.dndjqb_criteria,li.dndjqb_group').index(thisLI)===0){
                thisLI.next("li.dndjqb_AndOr").remove();
            }
            thisLI.remove();
        });

    },
    buildQueryObjectFromDOM: function() {
        this.queryObj = new this.CriteriaGroupObject();
        this.buildQueryObjectFromDOMNode($('#dndjqb_root'), this.queryObj);
        this.queryObj=this.queryObj.nestedElem[0];
        return this.queryObj;
    },
    buildQueryObjectFromDOMNode: function(DOMNode, objectNode) {
        if (DOMNode.hasClass('dndjqb_criteria')) {
            var fieldName = DOMNode.children('select.dndjqb_FieldDropdown').val();
            var op = DOMNode.children('span.dndjqb_opsField').children('select.dndjqb_opsDropdown').val();
            var value = DOMNode.children('span.dndjqb_valueField').children('.dndjqb_value').val();
            var connector = DOMNode.prev('li.dndjqb_AndOr').children('select').val();
            var co = new this.CriteriaObject(fieldName, op, value, connector);
            if (DOMNode.children('span.dndjqb_negation').children('input.dndjqb_neg').is(':checked')) {
                co.negated = true;
            }
            objectNode.nestedElem.push(co);
        } else if (DOMNode.hasClass('dndjqb_group')) {
            var cgo = new this.CriteriaGroupObject();
            var childrenCriteria = DOMNode.children('ul').children('li.dndjqb_criteria,li.dndjqb_group');
            for (var i = 0; i < childrenCriteria.length; i++) {
                this.buildQueryObjectFromDOMNode($(childrenCriteria[i]), cgo);
            }
            if (DOMNode.children('span.dndjqb_negation').children('input.dndjqb_neg').is(':checked')) {
                cgo.negated = true;
            }
            cgo.connector = DOMNode.prev('li.dndjqb_AndOr').children('select').val();
            objectNode.nestedElem.push(cgo);
        }
    },
    buildIfStatement: function(skipRebuildQueryObj) {
        if (!skipRebuildQueryObj){
            this.buildQueryObjectFromDOM();
        }
        var s="";
        s=this.buildIfStatementFromQueryObjNode(this.queryObj,s);
        return s;
    },
    buildIfStatementFromQueryObjNode:function(node,s){
        var s1="";
        if (node.type==="criteria"){
            var type=this.fields[node.fieldName].type;
            s1='('+node.fieldName+' '+this.ops[type][node.op]+' ';
            if (type==='numeric'){
                s1+=node.value;
            } else if (type==='text' || type==='select'){
                s1+='"'+node.value+'"';
            }
            s1+=')';
        } else if (node.type==="group"){
            /* //Ignore empty crit groups; doesn't work if the group is the first child
            if (node.nestedElem.length==0){
                return '';
            }*/
            var s2='';
            for (var i=0;i<node.nestedElem.length;i++){
                s2+=this.buildIfStatementFromQueryObjNode(node.nestedElem[i],'');
            }
            s1='('+s2+')';
        }
        if (node.negated){
            s1='(!'+s1+')';
        }
        if (node.connector!=null){
            s1=' '+node.connector+' '+s1;
        }
        s+=s1;
        return s;
    },
    buildQueryTreeFromQueryObj:function(input){
        var queryObj;
        if (typeof input ==="string"){
            queryObj=JSON.parse(input);
        } else if (typeof input ==="object"){
            queryObj=input;
        } else {
            console.log("Unable to set QueryObj");
            return;
        }
        this.resetTree();
        var newRoot=$('<li><ul></ul></li>');
        this.buildQueryTreeFromQueryObjNode(queryObj,newRoot);
        $('#dndjqb_root').children('ul').remove();
        $('#dndjqb_root').append(newRoot.children('ul').children('li').children('ul'));
        this.queryObj=queryObj;
                
    },
    buildQueryTreeFromQueryObjNode:function(objectNode,DOMNode){
        if (objectNode.type==="criteria"){
            this.buildCriteriaRow(DOMNode.children('ul'),undefined,objectNode);
        } else if (objectNode.type==="group"){
            this.buildGroupRow(DOMNode.children('ul'),undefined,objectNode);
            var insertedRow=DOMNode.children('ul').children('li.dndjqb_group,li.dndjqb_criteria').last();
            for (var i=0;i<objectNode.nestedElem.length;i++){
                this.buildQueryTreeFromQueryObjNode(objectNode.nestedElem[i],insertedRow);
            }
        }
    },
    setDragDropEvents: function() {
        var self = this;
        $('.dndjqb_draggable').off('dragstart').on('dragstart', function(event) {
            self.objOnDrag = $(event.target);
            event.originalEvent.dataTransfer.setData("text/html", event.target);
            //an object can't be dropped on itself
            $(event.target).on('drop', function() {
                return false;
            });
        });
        $('.dndjqb_droppable').off('drop').on('drop', function(event) {
            //drop event always fired twice? 
            event.preventDefault();
            var $eventTarget = $(event.target);
            $('.dndjqb_droppable').removeClass('dndjqb_highlighted');
            if (self.objOnDrag === null || $eventTarget === self.objOnDrag) {
                self.objOnDrag = null;
                return false;
            }
            var sourceAndOrDropdown = self.objOnDrag.prev('li.dndjqb_AndOr');
            if (self.objOnDrag.parent('ul').children('li').index(self.objOnDrag) === 0) {
                self.objOnDrag.next('li.dndjqb_AndOr').remove();
            }
            if ($eventTarget.hasClass('dndjqb_criteria')) {
                $eventTarget.after(self.objOnDrag);
                if (sourceAndOrDropdown.length) {
                    self.objOnDrag.before(sourceAndOrDropdown);
                } else {
                    self.buildAndOrRow(self.objOnDrag);
                }
            } else if ($eventTarget.hasClass('dndjqb_group')) {
                var originalChildrenCount = $eventTarget.children('ul').children('li.dndjqb_criteria,li.dndjqb_group').length;
                $eventTarget.children('ul').append(self.objOnDrag);
                if (originalChildrenCount > 0) {
                    if (sourceAndOrDropdown.length > 0) {
                        self.objOnDrag.before(sourceAndOrDropdown);
                    } else {
                        self.buildAndOrRow(self.objOnDrag);
                    }
                } else {
                    if (sourceAndOrDropdown.length > 0) {
                        sourceAndOrDropdown.remove();
                    }
                }
            }
            self.objOnDrag = null;
        });
        $('.dndjqb_droppable').off('dragover').on('dragover', function(event) {
            event.preventDefault();
            if ($(event.target).hasClass('dndjqb_criteria') || $(event.target).hasClass('dndjqb_group'))
                $(event.target).addClass('dndjqb_highlighted');
        });
        $('.dndjqb_droppable').off('dragleave').on('dragleave', function(event) {
            event.preventDefault();
            $(event.target).removeClass('dndjqb_highlighted');
        });
    },
    CriteriaObject: function(fieldName, op, value, connector) {
        this.type='criteria';
        this.negated = false;
        this.fieldName = fieldName;
        this.op = op;
        this.value = value;
        this.connector = connector; //AndOr values from the li.dndjqb_AndOr before it
    },
    CriteriaGroupObject: function() {
        this.type='group';
        this.nestedElem = [];
        this.connector = null;
        this.negated = false;
    },
    resetTree:function(){
        $('#dndjqb_root').children('ul').empty();
    }
};



