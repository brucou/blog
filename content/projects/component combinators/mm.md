---
title: "m - the generic component combinator"
date: 2017-05-09
lastmod: 2018-02-19
draft: false
tags: ["functional programming", "reactive programming", "user interface"]
categories: ["documentation", "programming"]
author: "brucou"
toc: true
comment: false
mathjax: true
---

# The case for `m`, the component factory

In a [previous article](/posts/a-componentization-framework-for-cyclejs/) about componentization frameworks, we saw how parallel and sequential 
composition are necessary to assemble components into a larger component. At the core of 
composition is a `combine` function which takes components and combine them into a target component, i.e `combine :: Array<Component> -> Component`. That function can take any extra arguments, in which case, by uncurrying, it is always possible to come back the canonical `combine` form shown previously. As any component used to derive another component can itself have been derived, componentization naturally leads to the manipulation of component trees.

The function `m` is a such a combinator, specialized to the domain of reactive systems's user interface, and which abstracts out a limited set of operations/patterns by which a component tree can be composed.

In what follows :

- `m` will be interchangeably termed as component combinator, component factory, utility function, or helper function.
- components will be understood as `:: Sources -> Settings -> Actions`, i.e. functions which :
  - take a `Sources` data structure which contains a way to receive event from event sources
  - take a `Settings` data structure which allows to parameterize the behaviour of the component
  - return an `Actions` data structure which encodes the actions to be performed by the reactive system under study.

**NOTE** : The type definition for components is adapted from the one used in the reactive framework `cyclejs`. We added the `Settings` parameter to cleanly separate the parameterization/configuration concern from the input sourcing concern. We believe this is an important, though trivial, design change, which allows, among other thing, for better readability. This is as a matter of fact in line with other major componentization efforts such as `React` which uses `props`  to that same parameterization effect.

# API
Abstracting from a large cyclejs codebase (20K+ lines of javascript), we retained a `m` combinator 
articulated around three computation strategies, from the most generic to the most specific :

- `CombineGenericSpecs`
- `CombineAllSinksSpecs`
- `CombinePerSinkSpecs`

Additionally, examining the patterns in that codebase, and given the specific importance of the 
DOM in a user interface implementation (!), we refined the array of components to incorporate an 
 optional container component, which subjects the rest of the components to convenient rules as per the merging of DOM 
 content (slot-based merge, as specified for web components).

Last, we incorporated other concerns that were frequently recurring in our codebase :

- parameterization of the `m` combinator
- contract checking (preconditions, postconditions)
- sources and settings preprocessing (we did not include sinks postprocessing (other than the 
 aforementioned postconditions checking), as this was relatively infrequently appearing in our codebase)

The API of `m` hence derives directly from these considerations.

 In what follows :

- the component returned by the `m` factory will be called combined component
- the container component, when present, will sometimes be called the parent component
- the remnant of the component will be called children components
- We will use `Sinks` as a type synonym for `Actions`, and `Sink` as a type synonym for `ActionStream`. This is to reuse the terminology put in vogue by `cyclejs`.

Let's go over the three computation strategies for `m`.

## `m :: CombineGenericSpecs -> Settings -> ComponentTree -> Component`
### Types
- `Component :: Sources -> Settings -> Sinks`
- `ComponentTree :: ChildrenComponents | [ContainerComponent, ChildrenComponents]`
- `ContainerComponent :: Component`
- `ChildrenComponents :: Array<Component>`
- `CombineGenericSpecs :: Record {`
  - `  computeSinks :: ParentComponent -> Array<Component> -> Sources -> Settings -> Sinks`
  - `  makeLocalSources :: Optional < Sources -> Settings -> Sources >`
  - `  makeLocalSettings :: Optional < Settings -> Settings >`
  - `  checkPreConditions :: Optional < Sources -> Settings -> Boolean >`
  - `  checkPostConditions :: Optional < Sinks -> Boolean >`
  - `}`

### Contracts
Aside from the type contracts, there is the possibility to configure user-defined contracts (pre- and post-conditions), which are predicates who return true if the contract is fulfilled. There is no further contracts.

### Description
The `CombineGenericSpecs` computation strategy is summarized in the following figure :

![m - CombineGenericSpecs](/img/graphs/m%20-%20CombineGenericSpecs.png)

As a matter of fact, the `m` factory returns a component computed as follows :

1. contracts are checked
  - if at least one contract fails, an exception is raised
2. additional sources and settings are generated via `makeLocalSources`, and `makeLocalSettings`
  - `makeLocalSources` returns the extra sources to inject  to the children and parent 
  components.
	  - If not present, no extra sources are added.
	  - `makeLocalSources` is called with the sources passed to the combined component and the fully merged settings (i.e. include also settings from `makeLocalSettings`)
		  -  Note that so far there has been no cases where an extra source might depend on settings. We expect the local sources factory to be independent of any settings but keep the door open, should that case occur.
	  -  In case of conflict, the local sources factory has the lowest precedence vs. the factory sources
  - `makeLocalSettings` returns the extra settings to inject to the settings passed in parameter 
  to the computed combined component.
    - If not present, no extra settings is added.
    - The local settings are computed from the merge of the computed combined component settings and  the `m` factory settings.
    - The local settings added have the lowest priority in case of conflict (cf. section on
    settings prioritization).
    - The settings passed in parameter to the combined component have the maximum priority.
    - the computed combined component settings have a priority between the two.
    - **TODO: seriously, draw it or give an example, that is totally obstruse**
3. the `computeSinks` reducing function computes the combined component's sinks from the parent component, children component, merged sources, and merged settings.

This is certainly the most generic strategy as the `computeSinks` function receives all the 
parameters from the `m` combinator, except the specs themselves. Such a generic form is for 
instance useful if the computation of the combined component depends on information held in the 
component themselves (type, names, number of arguments, number of components, presence of a 
container component, etc.).

However, in our codebase, we found very few cases where we would have needed to recourse to 
this most generic form. That form however comes in handy to create generic combinators ([`ForEach` 
combinator](https://github.com/brucou/component-combinators/blob/master/src/components/ForEach/ForEach.js) is such a case).

## `m :: CombineAllSinksSpecs -> Settings -> ComponentTree -> Component`
### Types
- `CombineAllSinksSpecs :: Record {`
  - `makeOwnSinks :: Sources -> Settings -> ParentSinks`
  - `mergeSinks :: ParentSinks -> Array<Sinks> -> Settings -> Sinks`
  - `makeLocalSources :: Optional < Sources -> Settings -> Sources >`
  - `makeLocalSettings :: Optional < Settings -> Settings >`
  - `checkPreConditions :: Optional < Sources -> Settings -> Boolean >`
  - `checkPostConditions :: Optional < Sinks -> Boolean >`
  - `}`

### Contracts
This signature fulfills the same contract as the general signature.

### Description
The `CombineAllSinksSpecs` computation strategy is summarized in the following figure :

![m - CombineAllSinksSpecs](/img/graphs/m%20-%20CombineAllSinksSpecs.png)

As a matter of fact, the `m` factory returns a component computed as follows :

- **1-3**. same as in the general signature
- **4**. Sinks are computed for each component from the merged sources and merged settings.
- **5**. Those sinks are later reduced by `mergeSinks` into the combined component sinks.

This computation strategy is more frequent than the most generic one, though still relatively 
infrequent. That form however comes in handy to create generic combinators (`Switch` combinator 
is such a case).

## `m :: CombinePerSinkSpecs -> Settings -> ComponentTree -> Component`
### Types
- `Sinks :: HashMap<SinkName, Sink>`
- `ContainerSink :: Sink`
- `Sink :: Stream <*>`
- `CombinePerSinkSpecs :: Record {`
  - `SinkMergeFn :: ContainerSink -> Array<Sink> -> Settings -> Sinks`
  - `mergeSinks :: HashMap<SinkName, SinkMergeFn>`
  - `makeLocalSources :: Optional < Sources -> Settings -> Sources >`
  - `makeLocalSettings :: Optional < Settings -> Settings >`
  - `checkPreConditions :: Optional < Sources -> Settings -> Boolean >`
  - `checkPostConditions :: Optional < Sinks -> Boolean >`
  - `}`

### Contracts
This signature fulfills the same contract as the general signature.

### Description
The `CombinePerSinkSpecs` computation strategy is summarized in the following figure :

![m - CombinePerSinkSpecs](/img/graphs/m%20-%20CombinePerSinkSpecs.png)

As a matter of fact, the `m` factory returns a component computed as follows :

- **1-3**. same as in the general signature
- **4**. Sinks are computed for each child component from the merged sources, and merged settings.
- **5**. For each sink (uniquely identified by `sinkName :: SinkName`) :
  - if there is a merge function defined in `mergeSinks` for that `sinkName`, that function is used to compute the resulting combined component sink from the parent's sink, the children components' sinks, and the merged settings.
  - If not, a default merge function is used :
    - If there is no slots in the container component, default DOM merge function will merge the 
    `VTree` from the children components **INSIDE** the `Vtree` from the container component's DOM sink
      - if there is no DOM sink at all, it returns `null`
      - if there is no container DOM sink, then it returns the children VTrees wrapped in a `div` VNode
      - if there is a container DOM sink, and there is no children DOM sinks, then it returns the parent DOM sink
      - if there is a container DOM sink, and there are children DOM sinks, then it returns a VTree in which the children DOM vNodes are children of the parent's vNode
      children vNodes are **appended** to any already existing children of the parent vNode
    - If there are slots in the container component, default DOM merge function will 
    distribute the `VTree` from the children components according to their respective 
    slots
    - Default non-DOM merge function will merge the parent's sink together with the children sinks via simple stream merge (i.e. `Rx.Observable.merge`)

Default merge functions have been extracted from patterns from our codebase. While non-DOM sinks 
ever rarely get merged in any other way than a simple observable merge, there are more patterns 
appearing for merging of DOM VTrees. Frequently, children DOM vNodes are merged immediately 
inside a parent DOM's vNodes. In the general case however, children DOM vNodes can be located arbitrarily inside 
the parent DOM's vNodes. Web components faced the same distribution issue and resolved it with a 
slot mechanism, and we reused that. This is how we arrived to our default merge functions :

- one unique strategy for non-DOM sinks
- two strategies for DOM sinks (container-based and slot-based)

The `CombinePerSinkSpecs` covers a large set of patterns of our code base. In fact, the default 
merge behaviour covers a large enough portion of cases which occur when combining components for 
us to create a `Combine` combinator, simply defined as a partial application of `m` with no 
specification (empty object passed as first parameter) : `Combine(settings, componentTree) = m 
({}, settings, componentTree)`.

# Examples
In this section, we are going to show miscellaneous examples of use of componentization with the`m` factory.
Most of those examples will be inspired from already-existent UI component library, such as`Semantic UI`.

Examples for the DOM merge functions are gathered in a [specific article](/projects/component-combinators/m-component---merge-default-functions/).

## Event factory component
- `Events = m(eventFactorySpec, eventFactorySettings, componentTree)`, or by partially applying `m` 
into `mEventFactory` :
- `Events = mEventFactory(EventFactorySettings, componentTree)`

This example makes use of :

- `checkPreConditions`
- a component tree with container and children
- `mergeSinks`
- utility function `defaultMergeSinkFn`

### Description
This component allows to create events from event sources. For ease of reasoning and
maintainability, the created events should be coupled to the DOM representation generated by the children component. There is however no enforcement of such property. The created events will be mixed with the sinks returned from the children components.

**Contracts:**

- an event sink generated from event sources MUST NOT conflict with a sink with the same key from the children component
- there MUST be an `events` property in the settings object. The corresponding object MAY be empty (event factory created no events).

###  EventFactorySettings
- `{`
  - `events : {`
    - `custom : {eventName : (sources, settings) =>  event$},`
    - `DOM : { DomEventName : {selectorDesc : 'selector'}}`
  - `}`
- `}`

Note that all events generated from the DOM remove the default DOM side effect with `preventDefault`.

#### `events.DOM` property
`events.DOM` is a list of selectors that MAY be later used in the children components, for instance to uniquely identify the target of an event. This allow to parameterize the coupling between the parent and the children components, i.e. between the events and the event targets.

`events.DOM` is also used to set an event listener on the matching DOM element (as specified by `selector`). Corresponding listened-to events will be streamed through a sink with identifier `[selectorDesc]_[DomEventName]`.

For instance :
```javascript
{
  events : {
    DOM : {
      click : {
        PriceSelector : '.block__element--modifier'
      }
    }
  }
}
```

will lead to registering a listener on the DOM element(s) identified by the selector `
.block__element--modifier`. As the events factory parameterization is inherited by
children (through settings), children components can reference within their DOM tree the passed on selector (`settings.events.DOM.click.PriceSelector`). Repetition is avoided and the coupling of behaviour and visual representation is made explicit.

#### `events.custom` property
This allows for generating a custom stream of events from the event source and settings.

For instance :
```javascript
{
  events : {
    custom : {
      [eventName] : (sources, settings) => sources.motionSensor.zipWith(sources.locationSensor)
    }
  }
}
```

The resulting stream of events is passed through the sink `eventName`.

### Source code
cf. [repo](https://github.com/brucou/component-combinators/blob/master/src/components/mEventFactory.js)

```javascript
const checkEventFactoryPreConditions = checkAndGatherErrors([
  [hasEventsProperty, `Settings parameter must have an events property!`],
  [isEventFactoryEventSettings, `settings' events property has unexpected shape!`]
], `checkEventFactoryPreConditions : fails!`);

/** Settings : 
 - `{`
 - `events : {`
 -   `custom : {eventName : (sources, settings) =>  event$},`
 -   `DOM : { eventName : {selectorDesc : 'selector}}`
 -   `}`
 - `}`
 * Returns : HashMap<EventName, Observable>
 */
function makeEventFactorySinks(sources, settings) {
  const { events: { custom, DOM } } = settings;

  const customEvents = reduce([...], {}, keys(custom));

  const DOMEvents = reduce([...], {}, keys(DOM));

  assertContract(hasNoDuplicateKeys, [customEvents, DOMEvents], `makeEventFactorySinks : Event definition object leads to at least one event name which is BOTH a custom event and a DOM event! (custom : ${format(customEvents)} ; DOM : ${format(DOMEvents)})`);

  return merge(customEvents, DOMEvents)
}

function mergeEventFactorySinksWithChildrenSinks(eventSinks, childrenSinks, localSettings) {
  const childrenSinksArray = flatten(removeNullsFromArray([childrenSinks]))
  const allSinks = flatten(removeNullsFromArray([eventSinks, childrenSinks]))
  const eventSinkNames = keys(eventSinks)
  const childrenSinkNames = getSinkNamesFromSinksArray(childrenSinksArray)
  const sinkNames = getSinkNamesFromSinksArray(allSinks)

  // We needed to make use of `combineAllSinks` strategy to enforce the following contract
  // which applies to the container sinks :
  // Children sinks cannot have the same sink name as event sinks
  assertContract(hasNoCommonValues, [eventSinkNames, childrenSinkNames],
    `mEventFactory > mergeEventFactorySinksWithChildrenSinks : found children sinks with 
           at least one sink name conflicting with an event sink : 
           ${eventSinkNames} vs. ${childrenSinkNames}`);

  // We guarded against sink telescoping, we just have to merge the events sinks to the sinks 
  // from the children component and we are done. Default merge is what we want
  return defaultMergeSinkFn(eventSinks, childrenSinks, localSettings, sinkNames)
}

const eventFactorySpec = {
  // No extra sources
  makeLocalSources: null,
  // No extra settings
  makeLocalSettings: null,
  // We check that the settings have the appropriate shape
  checkPreConditions: checkEventFactoryPreConditions,
  checkPostConditions: null,
  // We merge children sinks with the by-default merge functions
  mergeSinks: mergeEventFactorySinksWithChildrenSinks
}

export function mEventFactory(eventFactorySettings, componentTree) {
  // returns a component which default-merges sinks coming from the children
  // and adds its events sinks to it

  // NOTE : we could test against eventFactorySettings here, before doing it in `m` too
  // (fails fast). We will not.
  // Instead, we will wait for the settings passed to `mEventFactory` at
  // run time to be merged with the settings passed at creation time. This opens the
  // possibility to have a factory with some default events, and adding some additional events
  // at run time via settings
  return m(eventFactorySpec, eventFactorySettings, [makeEventFactorySinks, componentTree])
}
```

## Button component combinator
`Button = m(ButtonComponentSpec, ButtonComponentSettings, childrenComponents)`
`Button = mButton(ButtonComponentSettings, childrenComponents)`

This example makes use of :

- `checkPreConditions`
- a component tree with container and children
- (non-slotted) default merge of sinks (DOM and non-DOM sinks)

### Description
The button component is a `<div>` that will behave like a button, according to the parameters specified in settings. Cf. `semanticUI` documentation for a description of the settings properties.

- The component MAY listen to any of the regular DOM event associated to a button:
  - click, hover, etc.
- A button MAY have content inside, which is any valid HTML representation
- A button component inserts inside its tag the DOM content from its children components.
- Any non-DOM children sink is default-merged with the button sink with the same sink name.

###  ButtonComponentSettings
  - classes
  - emphasis : 'primary, secondary, positive, negative, basic'
  - tabIndex
  - animated : {'', fade, vertical}
  - label : {text, position : 'left, right'}
  - icon : for instance 'cloud' - must be mapped to an actual icon previously
  - visualState : 'active, disabled, loading'
  - social : 'facebook, twitter, google, vk, linkedin, instagram, youtube'
  - size 'mini tiny small medium large big huge massive'
  - layout : 'compact, fluid, attached, top attached, bottom attached, left attached, right attached'
  - listenTo : event list such as click, hover, etc.

### Source code
Cf. [repo](https://github.com/brucou/component-combinators/blob/master/src/components/mButton.js)

```javascript
export function mButton(mButtonSettings, childrenComponents) {
  // returns a DOM tree representation with the specifications passed through settings
  // and enclosing the DOM trees returned by the children components
  // Non-DOM children sinks are default-merged

  return m(mButtonSpec, mButtonSettings, [makeButtonSinks, childrenComponents])
}

function makeButtonSinks(sources, settings) {
  let attrs = {};
  const buttonClasses = ['ui', 'button'];
  const focusable = true;
  const {
    classes, listenOn, emphasis, basic, animated, label, icon, visualState, social, size, shape, layout, listenTo
  } = settings;

  if (classes) {
    Array.prototype.push.apply(buttonClasses, classes);
  }

  if (focusable) {
    attrs.tabindex = '0';
  }

  if (emphasis) {
    buttonClasses.push(emphasis);
  }

[...]

  const classObject = buttonClasses
    ? reduce((acc, className) => {
      acc[className] = true
      return acc
    }, {}, buttonClasses)
    : null;

  let sinks = {};
  if (listenTo && listenOn) {
    sinks = reduce((acc, eventName) => {
      acc[eventName] = sources.DOM.select(listenOn).events(eventName);

      return acc
    }, {}, listenTo)
  }
  sinks.DOM = $.of(
    div({
      class: classObject,
      attrs: attrs
    })
  )

  return sinks
}
```

We hence have :

  - `makeButtonSinks` which generates `<div class = 'ui button ...'> </div>`
    - class list will depend on settings
  - children component's DOM sinks will correspond to `Content` in
  `<div class = 'ui button ...'> Content </div>`
    - that is the default non-slotted DOM merge
    - we keep also the non-DOM sinks returned by the children (default non-DOM sink merge)
    - content MAY be empty

# Tips

- when writing the component tree, a common error is to use `[containerComponent]` to signify a 
container component without children. This will actually be parsed as one unique child component (i.e. as `[uniqueChild]`). The correct syntax would be `[containerComponent, []]`.

# Bibliography
- Brooks, Fred P. (1986). "No Silver Bullet — Essence and Accident in Software Engineering". 
Proceedings of the IFIP Tenth World Computing Conference: 1069–1076
- Ernst, Erik. "Separation of concerns." Proceedings of the AOSD 2003 Workshop on Software-Engineering Properties of Languages for Aspect Technologies (SPLAT), Boston, MA, USA. 2003.
https://pdfs.semanticscholar.org/c052/f9d0e7e4c89a9d7abd36ffed4051ec59bb64.pdf
