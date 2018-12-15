---
title: "InjectCircularSources"
date: 2018-04-12
lastmod: 2018-04-30
draft: false
tags: ["functional programming", "reactive programming", "user interface"]
categories: ["documentation", "programming"]
author: "brucou"
toc: true
mathjax: true
comment: false
---
# Motivation
The `InjectCircularSources` component allows to inject a behaviour source (or simply behaviour) 
and/or an event source into children components, both of which can be instrumented through 
processing commands received through the relevant sinks. 

The `InjectCircularSources` responds to the need to have encapsulated components, which holds and
 manage their own state independently, and are able to interact with the external world with the 
 help of a command processor, which receives, interprets, executes and returns the results of 
 incoming commands. The command processor being external to the component, from the point of view
  of the application using the component, the component acts very much as an automata (more 
  specifically a [class of automata termed state transducers](https://brucou.github.io/posts/user-interfaces-as-reactive-systems/#reactive-systems-as-automata)), which produces an output on 
  reception of an input. The component, encapsulating a set of functionalities realized by its 
  children, can also be seen as a [web-component](https://en.wikipedia.org/wiki/Web_Components) 
  of sorts.

A typical example would be a calendar component, which can receive new calendar entries as 
inputs, and update its internal state to display the updated calendar visualization. That 
calendar component might also need to query other calendars to synchronize entries. Such 
components with internal state and interaction with the exterior world, can be implemented in an
 encapsulated way with the `InjectCircularSources` component.

# API

## InjectCircularSources :: InjectCircularSourcesSettings -> ComponentTree -> InjectCircularSourcesComponent

### Description
Creates an encapsulated component whose behaviour is parameterized via 
`InjectCircularSourcesSettings`.

The parametrization is as follows :

- `behaviour` : an object specifying the encapsulated piece of state for the component tree as a 
behaviour. In particular, are detailed here the behaviour source name; the initial value for the 
behaviour; the function processing behaviour update commands ; and optionally a function called 
when the behaviour is terminated, which can be used to release any used resources -- resources 
could be used when computing the initial value for the behaviour.

- `event` : an object specifying the interface by which the component will communicate with the 
outside world. In particular, are detailed here the event source name by which results from 
command execution will be received; the command processor, which executes the commands; 
optionally a function called when the event source is terminated. 

The behaviour of the component is as follows :

- behaviour source and event source are created (technically speaking, they are subjects)
- behaviour source is initialized with the initial state
  - the initial state is taken as is if it is an object, or computed if it is a function. In the 
  latter case, that funcion returns a constructor, which executed returns the desired initial 
  state
- event source and behaviour source are passed down the component tree and are hence visible by 
all components 
- behaviour sink receives update commands describing how to update the behaviour
- event sink receives commands describing an operation to execute. Such commands are executed and
 the result of such is passed back to the eponym source
- any error occurring during the processing of the commands leads to the partial termination of 
the component tree (namely the portion of the tree which depends on the terminated source)
- THERE IS NO SEQUENTIALITY GUARANTEE, i.e. two executed commands might see their results 
received in an order different of that of the execution
- order of subscription
  - the behaviour source is subscribed first
  - the event source is subscribed second
  - the remainder of upper-stream sources are subscribed after
- computing of update/results
  - the command processor takes a command and returns a stream of results
  - the behaviour updates takes the current value of the behaviour, the update command ; and 
  returns an updated behaviour value. That value is cached prior to scheduling its emission
    - this allows in particular to have commands whose semantics include operations on a delta vs. 
    the current behaviour value. That is, instead of computing the new value entirely from 
    scratch, it can be computed as an update of a portion of the current value.
    - More prosaically, the behavior updating function can be seen as a reducer
- scheduling of update/results
  - behaviour value updates and command execution results are passed from the relevant sink to 
  the eponym source **asynchronously**, always. However they are passed as soon as possible, via 
  use of the `currentThread` scheduler
- sinks filtering
  - behaviour and event sinks are not passed or visible upstream. They stop at the 
`InjectCircularSources` level. 
  - The remainder of sinks are merged as usual.

### Types
- `InjectCircularSourcesComponent :: Component`
- `ComponentTree :: ChildrenComponents | [ParentComponent, ChildrenComponents]`
- `ParentComponent :: Component`
- `ChildrenComponents :: Array<Component>`
- `InjectCircularSourcesSettings :: Record {`
- `  behaviour :: BehaviourConfig` 
- `  event :: EventConfig`
- `}`
- `BehaviourConfig :: Record {`
- `  behaviourSourceName :: SourceName` 
- `  processingBehaviourFn :: Command -> BehaviourValue -> BehaviourValue`
- `  initialBehaviorValue :: BehaviourValue`
- `  finalizeBehaviourSource :: BehaviourCache -> ()`
- `}`
- `EventConfig :: Record {`
- `  eventSourceName :: SourceName` 
- `  processingEventFn :: Command -> Stream<CommandResult>`
- `  finalizeEventSource :: () -> ()`
- `}`

### Contracts
- At least one of the `behaviour` or `event` property must be set in the  
`InjectCircularSourcesSettings` object.
- the behaviour update function **must not** mutate the behaviour value passed in parameter 
 
# Example
Cf. `Tree` component source code and tests.
**TODO** : add url when merged in master

# Tips
