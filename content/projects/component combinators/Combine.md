---
title: "Combine"
date: 2018-02-18
lastmod: 2018-02-19
draft: false
tags: ["functional programming", "reactive programming", "user interface"]
categories: ["documentation", "programming"]
author: "brucou"
toc: true
comment: false
mathjax: true
---

# Motivation
The `Combine` combinator takes settings and components as parameters and produces a combined 
component whose behaviour is the sum, in a sense precised thereafter, of the behaviours of the 
components passed as parameters (we will refer to them as parameter components).

The `Combine` combinator hence allows to build up components from smaller components. Each 
parameter component represents a behaviour which is described by `Sources` and `Settings` mapped 
to `Sinks`. The `Combine` combinator takes each of the sinks produced by the parameter 
components, and combine them into the sinks for the combined component according to a mechanism 
described in a [dedicated article](/projects/component-combinators/m-component---merge-default-functions/).

In short:
 
- all the parameter components' non-DOM sinks of a given name are merged (`Rx.Observable.merge`) into a combined sink of the same name 
- all the parameter components' DOM sinks are merged according to a container and slot mechanism 
(the latter inspired from web-components specifications)
  - **container mechanism** : the parameter components can be passed as an array of components (no
   container component), or in the form `[ContainerComponent, Array<Component>]`. When a 
   container component is present, the DOM sinks' `vNode` content of the other parameter components 
   will be inserted **within** the `vNodes` of the container component -- hence the name container 
   component. All non-DOM sinks of the container component are merged as usual
  - **slot mechanism** : the container component has the possibility to refine the parameter 
  components' `vNode` insertion mechanism by defining slots to which `vNode`s can be distributed 
  to. There are named slots and default slots for `vNode` content which do not belong to any named 
  slots. There is also the possibility for all slots to have default content, in case no matching
   `vNode` is found in the parameter component's `vNode` content. That mechanism is pegged to the
    slot mechanism specified with web components. Hence most relevant documentation to the web 
    component's slot mechanism apply to this library.

Further details with examples can be found in a [dedicated article](/projects/component-combinators/m-component---merge-default-functions/).

# API

## Combine :: Settings -> ComponentTree -> CombinedComponent

### Types
Settings must be an object, and can be empty (`{}`).

- `Settings :: *`
- `Component :: Sources -> Settings -> Sinks`
- `CombinedComponent :: Component`
- `ComponentTree :: ChildrenComponents | [ContainerComponent, ChildrenComponents]`
- `ContainerComponent:: Component`
- `ChildrenComponents :: Array<Component>`

### Contracts
- there has to be at least one component passed as parameters, i.e. empty arrays for instance are
 not permitted

# Examples
- [demo](https://github.com/brucou/component-combinators/tree/master/examples/CombineDemo)
- some examples for the `m` component factory are valid, as `Combine(settings, componentTree)` is 
just `m({}, settings, componentTree)`.

# Tips
