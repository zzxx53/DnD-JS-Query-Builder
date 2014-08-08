function QueryTreeBuilder(containerID, fieldsDict) {
    this.rootID = containerID;
    $('#' + containerID).html('<ul class="tree"><li id="root" class="group droppable">Root&emsp;&emsp;<button class="add">Add Node</button><button class="addGroup">Add Group</button><ul></ul></li></ul>');
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
    buttonString: '<button class="add">Add Node</button><button class="addGroup">Add Group</button><button class="remove">Remove Node</button>',
    andOrDropdownString: '<li class="AndOr"><select><option>AND</option><option>OR</option></select></li>',
    negatedCheckboxString: 'Negated? <span class="negation"><input type="checkbox" class="neg"></span>',
    objOnDrag: null,
    opsDropdown: {},
    buildOpsDropdown: function(type) {
        this.opsDropdown[type] = '<select class="opsDropdown">';
        var operators=Object.keys(this.ops[type]);
        for (var i = 0; i < operators.length; i++) {
            this.opsDropdown[type] += "<option>" + operators[i] + "</option>";
        }
        this.opsDropdown[type] += "</select>";
    },
    selectDropdown: {},
    buildSelectDropdown: function(selectID) {
        this.selectDropdown[selectID] = '<select class="value">';
        for (var i = 0; i < this.fields[selectID].values.length; i++) {
            this.selectDropdown[selectID] += "<option>" + this.fields[selectID].values[i] + "</option>";
        }
        this.selectDropdown[selectID] += "</select>";
    },
    buildFieldDropdown: function(parentObj) {
        var fieldNames = Object.keys(this.fields);
        var dropdownText = '<select class="FieldDropdown">';
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
            $(this).siblings("span.opsField").html(self.opsDropdown[self.fields[fieldName].type]);
            if (self.fields[fieldName].type === "select") {
                if (!self.selectDropdown[fieldName]) {
                    self.buildSelectDropdown(fieldName);
                }
                $(this).siblings("span.valueField").html(self.selectDropdown[fieldName]);
            } else {
                $(this).siblings("span.valueField").html('<input class="value" />');
            }
        });
    },
    buildCriteriaRow: function(parentObj, childIndex,rowData) {
        var inserted = $('<li class="criteria draggable droppable" draggable="true">Criteria&emsp;&emsp;</li>');
        inserted.append(this.negatedCheckboxString + '&emsp;');
        if (childIndex === undefined) {
            parentObj.append(inserted);
        } else {
            $(parentObj.children('li.criteria')[childIndex]).after(inserted);
        }
        this.buildFieldDropdown(inserted);
        inserted.append("<span class='opsField'></span><span class='valueField'></span>&emsp;");
        inserted.append(this.buttonString);
        if (inserted.prev('li.criteria,li.group').length) {
            this.buildAndOrRow(inserted);
        }
        inserted.children('select.FieldDropdown').change();
        this.setButtonEvents();
        this.setDragDropEvents();
        if (rowData!= undefined){
            inserted.children('select.FieldDropdown').val(rowData.fieldName);
            inserted.children('select.FieldDropdown').change();
            inserted.children('span.opsField').children('select.opsDropdown').val(rowData.op);
            inserted.children('span.valueField').children('.value').val(rowData.value);
            if (rowData.negated){
                inserted.children('span.negation').children('input.neg').prop('checked',true);
            }
            if (rowData.connector !=null){
                inserted.prev("li.AndOr").children('select').val(rowData.connector);
            }
        }
    },
    buildAndOrRow: function(criteriaRowObj) {
        criteriaRowObj.before(this.andOrDropdownString);
    },
    buildGroupRow: function(parentObj, childIndex,rowData) {
        var inserted = $('<li class="group draggable droppable" draggable="true">Criteria Group&emsp;&emsp;' + this.negatedCheckboxString + '&emsp;' + this.buttonString + "<ul></ul></li>");
        if (childIndex === undefined) {
            parentObj.append(inserted);
        } else {
            $(parentObj.children('li.criteria')[childIndex]).after(inserted);
        }
        if (inserted.prev('li.criteria,li.group').length) {
            this.buildAndOrRow(inserted);
        }
        this.setButtonEvents();
        this.setDragDropEvents();
        if (rowData!= undefined){
            if (rowData.negated){
                inserted.children('span.negation').children('input.neg').prop('checked',true);
            }
            if (rowData.connector !=null){
                inserted.prev("li.AndOr").children('select').val(rowData.connector);
            }
        }
    },
    setButtonEvents: function() {
        var self = this;
        $(".add").off('click').click(function() {
            if ($(this).closest('li').hasClass('criteria')) {
                var thisLI = $(this).closest('li');
                var parent = thisLI.parent('ul');
                self.buildCriteriaRow(parent, parent.children('li.criteria').index(thisLI));
            } else if ($(this).closest('li').hasClass('group')) {
                self.buildCriteriaRow($(this).siblings('ul'));
            }
        });
        $(".addGroup").off('click').click(function() {
            if ($(this).closest('li').hasClass('criteria')) {
                var thisLI = $(this).closest('li');
                var parent = thisLI.parent('ul');
                self.buildGroupRow(parent, parent.children('li.criteria').index(thisLI));
            } else if ($(this).closest('li').hasClass('group')) {
                self.buildGroupRow($(this).siblings('ul'));
            }
        });
        $(".remove").off('click').click(function() {
            var thisLI = $(this).closest("li");
            thisLI.prev("li.AndOr").remove();
            thisLI.remove();
        });

    },
    buildQueryObjectFromDOM: function() {
        this.queryObj = new this.CriteriaGroupObject();
        this.buildQueryObjectFromDOMNode($('#root'), this.queryObj);
        this.queryObj=this.queryObj.nestedElem[0];
        return this.queryObj;
    },
    buildQueryObjectFromDOMNode: function(DOMNode, objectNode) {
        if (DOMNode.hasClass('criteria')) {
            var fieldName = DOMNode.children('select.FieldDropdown').val();
            var op = DOMNode.children('span.opsField').children('select.opsDropdown').val();
            var value = DOMNode.children('span.valueField').children('.value').val();
            var connector = DOMNode.prev('li.AndOr').children('select').val();
            var co = new this.CriteriaObject(fieldName, op, value, connector);
            if (DOMNode.children('span.negation').children('input.neg').is(':checked')) {
                co.negated = true;
            }
            objectNode.nestedElem.push(co);
        } else if (DOMNode.hasClass('group')) {
            var cgo = new this.CriteriaGroupObject();
            var childrenCriteria = DOMNode.children('ul').children('li.criteria,li.group');
            for (var i = 0; i < childrenCriteria.length; i++) {
                this.buildQueryObjectFromDOMNode($(childrenCriteria[i]), cgo);
            }
            if (DOMNode.children('span.negation').children('input.neg').is(':checked')) {
                cgo.negated = true;
            }
            cgo.connector = DOMNode.prev('li.AndOr').children('select').val();
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
        //console.log(s)
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
    buildQueryTreeFromQueryObj:function(str){
        var queryObj=JSON.parse(str);
        this.resetTree();
        var newRoot=$('<li><ul></ul></li>');
        this.buildQueryTreeFromQueryObjNode(queryObj,newRoot);
        $('#root').children('ul').remove();
        $('#root').append(newRoot.children('ul').children('li').children('ul'));
        this.queryObj=queryObj;
                
    },
    buildQueryTreeFromQueryObjNode:function(objectNode,DOMNode){
        if (objectNode.type==="criteria"){
            this.buildCriteriaRow(DOMNode.children('ul'),undefined,objectNode);
        } else if (objectNode.type==="group"){
            this.buildGroupRow(DOMNode.children('ul'),undefined,objectNode);
            var insertedRow=DOMNode.children('ul').children('li.group,li.criteria').last();
            for (var i=0;i<objectNode.nestedElem.length;i++){
                this.buildQueryTreeFromQueryObjNode(objectNode.nestedElem[i],insertedRow);
            }
        }
    },
    setDragDropEvents: function() {
        var self = this;
        $('.draggable').off('dragstart').on('dragstart', function(event) {
            self.objOnDrag = $(event.target);
            event.originalEvent.dataTransfer.setData("text/html", event.target);
            //an object can't be dropped on itself
            $(event.target).on('drop', function() {
                return false;
            });
        });
        $('.droppable').off('drop').on('drop', function(event) {
            //drop event always fired twice? 
            console.log('drop event fired');
            event.preventDefault();
            var $eventTarget = $(event.target);
            $('.droppable').removeClass('highlighted');
            if (self.objOnDrag === null || $eventTarget === self.objOnDrag) {
                self.objOnDrag = null;
                return false;
            }
            var sourceAndOrDropdown = self.objOnDrag.prev('li.AndOr');
            if (self.objOnDrag.parent('ul').children('li').index(self.objOnDrag) === 0) {
                self.objOnDrag.next('li.AndOr').remove();
            }
            if ($eventTarget.hasClass('criteria')) {
                $eventTarget.after(self.objOnDrag);
                if (sourceAndOrDropdown.length) {
                    self.objOnDrag.before(sourceAndOrDropdown);
                } else {
                    self.buildAndOrRow(self.objOnDrag);
                }
            } else if ($eventTarget.hasClass('group')) {
                var originalChildrenCount = $eventTarget.children('ul').children('li.criteria,li.group').length;
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
        $('.droppable').off('dragover').on('dragover', function(event) {
            event.preventDefault();
            if ($(event.target).hasClass('criteria') || $(event.target).hasClass('group'))
                $(event.target).addClass('highlighted');
        });
        $('.droppable').off('dragleave').on('dragleave', function(event) {
            event.preventDefault();
            $(event.target).removeClass('highlighted');
        });
    },
    CriteriaObject: function(fieldName, op, value, connector) {
        this.type='criteria';
        this.negated = false;
        this.fieldName = fieldName;
        this.op = op;
        this.value = value;
        this.connector = connector; //AndOr values from the li.AndOr before it
    },
    CriteriaGroupObject: function() {
        this.type='group';
        this.nestedElem = [];
        this.connector = null;
        this.negated = false;
    },
    resetTree:function(){
        $('#root').children('ul').empty();
    }
};



