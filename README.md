Draggable JS Query Builder
==============
This is a proof-of-concept attempt at a JavaScript if-statement tree builder **with drag-and-drop support**. 
There has been various libraries that allows for a visual approach for building complex 
queries (hats off to [Knockout.js Query Builder] (http://kindohm.github.io/knockout-query-builder/)), 
but none of them supports dragging conditions around to alter the tree structure. Thanks 
to the new [HTML5 Drag-and-Drop API] (https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Drag_and_drop), 
this task has become much easier. 

Preliminarily tested in Firefox and Chrome; comments are welcome. 

##Configuration & Usage

###Initialization
The QueryTreeBuilder object takes two parameters: the container and the data column dictionary. 

The container may either be the id of a `DIV` element, or a jQuery object referring the element. 

The data column dictionary defines the data columns one would like to use in the boolean expressions. 
The data columns are typed; the program currently supports text, numbers and selection boxes. If a data column has
type "select", a list of possible values must be provided. A sample data column dictionary is shown below: 
```
var colDict={
name: {type: "text"},
age: {type: "numeric"},
sex: {type: "select", values: ["male", "female"]}
}
```

Sample initialization code: 
```
var queryTreeBuilder = new QueryTreeBuilder("tree", colDict);
```
###Properties and methods of the QueryTreeBuilder object
* QueryTreeBuilder.buildIfStatement()
  * Build a boolean expression representing the query criteria tree
  * Returns the boolean expression as a string
  * Takes one optional parameter: skipRebuildQueryObj - 
when set to true, will build a boolean expression directly from QueryTreeBuilder.queryObj without rebuilding it from the query criteria tree first
* QueryTreeBuilder.queryObj
  * An object representation of the query criteria tree
  * Updated only after QueryTreeBuilder.buildQueryObjectFromDOM() is called, not every time the tree changes
* QueryTreeBuilder.buildQueryObjectFromDOM()
  * Build / rebuild QueryTreeBuilder.queryObj according to the current query criteria tree
  * Returns the same QueryObj
* QueryTreeBuilder.buildQueryTreeFromQueryObj()
  * Clears the current query criteria tree, then rebuild it using the QueryObj given
  * Takes one parameter: QueryObj - could be either the object itself or its JSON representation


##Technical notes
* If the query criteria tree contains empty criteria groups, the QueryTreeBuilder will process it 
as is - the boolean expression built will contain a set of empty parenthesis representing 
the empty criteria set, which makes it invalid. It is thus suggested that the user checks for 
empty criteria sets before building the statements. 
* The list of operators supported by each data type is coded in `QueryTreeBuilder.ops` object. 
It may be directly swapped out for a more desired one after initialization: `queryTreeBuilder.ops=newOpsDict` .
Note that the first level keys are the data type names; the second level keys are the operators' 
display name on the page; the values are what's used in the boolean statements. 
The one that ships with the program is shown below: 

```
{
    text: {"equals":"==", "begins with":"%=", "ends with":"=%", "contains":"%=%"},
    numeric: {"equals":"==", "gt":">", "lt":"<", "ge":">=", "le":"<="},
    select: {"equals":"=="}
}
```

