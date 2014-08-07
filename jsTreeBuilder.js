function QueryTreeBuilder(containerID, fieldsDict) {
            this.rootID = containerID;
            $('#' + containerID).html('<ul class="tree"><li id="root" class="group droppable">Root&emsp;&emsp;<button class="add">Add Node</button><button class="addGroup">Add Group</button><ul></ul></li></ul>')
            this.fields = fieldsDict;
            this.setButtonEvents();
        }
        QueryTreeBuilder.prototype = {
            fieldDropdownString: "",
            queryObj: {},
            fields: {},
            ops: {
                text: ["equals", "begins with", "ends with", "contains"],
                numeric: ["equals", "gt", "lt", "ge", "le"],
                select: ["equals"],
            },
            buttonString: '<button class="add">Add Node</button><button class="addGroup">Add Group</button><button class="remove">Remove Node</button>',
            andOrDropdownString: '<li class="AndOr"><select><option>AND</option><option>OR</option></select></li>',
            objOnDrag: null,
            opsDropdown: {},
            buildOpsDropdown: function(type) {
                this.opsDropdown[type] = "<select>";
                for (var i = 0; i < this.ops[type].length; i++) {
                    this.opsDropdown[type] += "<option>" + this.ops[type][i] + "</option>";
                }
                this.opsDropdown[type] += "</select>";
            },
            selectDropdown: {},
            buildSelectDropdown: function(selectID) {
                this.selectDropdown[selectID] = "<select>";
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
                        $(this).siblings("span.valueField").html("<input />");
                    }
                });
            },
            buildCriteriaRow: function(parentObj, childIndex) {
                var inserted = $('<li class="criteria draggable droppable" draggable="true">Criteria&emsp;&emsp;</li>');
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
            },
            buildAndOrRow: function(criteriaRowObj) {
                criteriaRowObj.before(this.andOrDropdownString);
            },
            buildGroupRow: function(parentObj, childIndex) {
                var inserted = $('<li class="group draggable droppable" draggable="true">Criteria Group&emsp;&emsp;' + this.buttonString + "<ul></ul></li>");
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
                this.queryObj = buildQueryObjectFromDOMNode($('#root'), new CriteriaGroupObject());
            },
            buildQueryObjectFromDOMNode: function(DOMNode, objectNode) {
                if (DOMNode.hasClass('criteria')){
                    objectNode
                } else if (DOMNode.hasClass('group')){
                    
                }
            },
            buildIfStatementFromDOM: function() {

            },
            setDragDropEvents: function() {
                var self = this;
                $('.draggable').off('dragstart').on('dragstart', function(event) {
                    self.objOnDrag = $(event.target);
                    event.originalEvent.dataTransfer.setData("text/html", event.target);
                    //an object can't be dropped on itself
                    $(event.target).on('drop',function(){
                        return false;
                    });
                })
                $('.droppable').off('drop').on('drop', function(event) {
                    //drop event always fired twice? 
                    console.log('drop event fired')
                    event.preventDefault();
                    var $eventTarget = $(event.target);
                    $('.droppable').removeClass('highlighted');
                    if (self.objOnDrag === null || $eventTarget == self.objOnDrag) {
                        self.objOnDrag = null;
                        return false;
                    }
                    var sourceAndOrDropdown = self.objOnDrag.prev('li.AndOr');
                    if (self.objOnDrag.parent('ul').children('li').index(self.objOnDrag)===0){
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
                            if (sourceAndOrDropdown.length>0) {
                                self.objOnDrag.before(sourceAndOrDropdown);
                            } else {
                                self.buildAndOrRow(self.objOnDrag);
                            }
                        } else {
                            if (sourceAndOrDropdown.length>0) {
                                sourceAndOrDropdown.remove();
                            }
                        }
                    }
                    self.objOnDrag=null;
                })
                $('.droppable').off('dragover').on('dragover', function(event) {
                    event.preventDefault();
                    if ($(event.target).hasClass('criteria') || $(event.target).hasClass('group'))
                        $(event.target).addClass('highlighted');
                })
                $('.droppable').off('dragleave').on('dragleave', function(event) {
                    event.preventDefault();
                    $(event.target).removeClass('highlighted');
                })
            }
        };

        function CriteriaObject(fieldName,op,value){
            this.negated=false;
            this.fieldName=fieldName;
            this.op=op;
            this.value=value;
        }
        function CriteriaGroupObject(){
            this.nestedElem=[]; //Array of CriteriaObject
            this.negated=false;
        }
