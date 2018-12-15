---
title: "Tree UI component"
date: 2018-05-25
lastmod: 2018-05-25
draft: false
tags: ["functional programming", "reactive programming", "user interface"]
categories: ["documentation", "programming"]
author: "brucou"
toc: true
comment: false
mathjax: true
---

# Motivation
The tree component aims at displaying tree data structures in a visually meaningful way. It aims 
to be generic enough to be freely customized, according to the constraints of the chosen 
visualization. Also it should allow to select plugins, to build a final visualization 
from a range of visualization additive effects (selectable nodes, foldable nodes, etc.). 

# API

## Tree :: TreeSettings -> Components -> TreeComponent

### Description
Creates a `TreeComponent` component whose behaviour is parameterized via `TreeSettings`. Children
 components are components specifying appearance and behaviour of the root node, intermediary 
 nodes, and leaf nodes, and dealing with the edge case where the tree to visualize is 'empty' (i.e.
  `null` or `undefined`).

The parametrization is as follows :

- an array of sink names must be passed to indicate which sinks are to be extracted from the 
`Components`
- the `treeSource` property gives the name of the source which will emit tree data structures
- the `localStateSource` property gives the name of the source holding the state of the 
`TreeComponent`. This may include for instance whether a particular node is folded or expanded.
- the `localTreeSetting` property is such that `settings[localTreeSettings]` contains the actual 
tree to display (reminder : a component is  `fn(sources, settings)`)
- `defaultUIstateNode` is the default UI state for each node when it is first displayed
- `localCommandSpecs` specifies a command sink (hence an eponym command result source), and a 
command processing function, receiving, and executing the received commands
- the incoming value from the `from` configured source is passed to the children component in their settings in a property configured in the `as` property of the `ForEach` component's settings.
- `lenses` specifies the specific encoding of the tree (cf. [`fp-rose-tree` library documentation](https://github.com/brucou/functional-rose-tree#concepts))

The behaviour is as follows :

- A `TreeSource` source emits a tree data structure, which can be traversed thanks to the 
parameterized lenses
- For each new tree, the ui state is re-computed :
  - new nodes are given the `defaultUIstateNode` value
  - existing nodes do not lead to updating the ui state
  - the accumulated ui state is a hash whose key is a path to the tree, and value is the ui state 
  for the node at that path
- if the tree data structure is 'empty' (i.e. null or undefined), the `TreeEmpty` component is 
activated
- Otherwise, the tree data structure is traversed (post-order traversal), the result of the 
traversal being a component which is build recursively from the tree content by matching the leaf
 nodes to `TreeLeaf` component, and the rest of the nodes (including the root node) to `TreeNode`
 . That result is then wrapped within the `TreeRoot` container component. 
   - Ex : a tree like `[[N0, [N1, N2], N3]]` will correspond to a component of the form... :
   
```
m({...), [ TreeRoot, [
  m({...}, [TreeLeaf]), 
  m({...}, [TreeNode, [
    m({...}, [TreeLeaf]), 
    m({...}, [TreeLeaf])
  ]]), 
  m({...}, [TreeLeaf])
]])
```

   - Note as each `TreeNode` acts as a container component for `TreeLeaf` and downstream `TreeNode`s
- ... with the information about `N0`, `N1` etc. passed to `TreeNode`, `TreeLeaf` etc. through 
settings
- `Tree...` components can  : 
  -  access the tree settings they are passed due to inheritance. In particular, they have access
   to `localTreeSettings` and `localStateSource`
  - access the tree data structure through `settings[localTreeSettings]`, 
  - access the path and label for the node they are associated through `settings.path`, or 
  `settings.label`
  - access the tree UI state through the `sources[localStateSource]`
  - emit commands through the sink with name given by `localCommandSpecs.source`, and execute 
  those commands through the function passed in `localCommandSpecs.executeFn`. The result of 
  these commands is passed back the source with name given by `localCommandSpecs.source`
    - A typical use of these commands is to fetch data when some events occurs on a given 
    node of the displayed tree
    - Note that errors occurring during the execution of commands are passed as is through the 
    source, and terminate it (per Rxjs contract). Hence, if an error can be recovered from or 
    should be ignored, it is better to encode as a regular message, rather than an error 
    notification.
- UI state and command sinks are not propagated upstream. Other sinks from the `Tree...` components 
are passed upstream the component tree.

### Types

- `TreeComponent :: Component`
- `Components :: [TreeEmpty, TreeRoot, TreeNode, TreeLeaf]`
- `TreeEmpty :: Component`
- `TreeRoot :: Component`
- `TreeNode :: Component`
- `TreeLeaf :: Component`
- `TreeSettings :: Record {`
- `  treeSource :: SourceName`
- `  localStateSource :: SourceName`
- `  localTreeSetting :: String`
- `  defaultUIstateNode :: *` 
- `  localCommandSpecs :: Record { source :: SourceName, executeFn :: Command -> 
Observable<Result>}`  **Optional**
- `  lenses :: TreeLenses` 
- `  sinkNames :: Array<SinkName>`
- `}`

### Contracts
TODO

# Example
TODO

# Tips
The generic API retained for Tree UI component allows to define plugins reasonably easily, by 
combining core `TreeRoot`, `TreeNode`, and `TreeLeaf` components with plugins'.

TODO : example of normal tree, then enhanced with tree with foldable ability
