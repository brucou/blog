---
title: "Query driver"
date: 2017-09-03
lastmod: 2018-01-27
draft: false
tags: ["functional programming", "reactive programming", "user interface"]
categories: ["documentation", "programming"]
author: "brucou"
toc: true
comment: false
mathjax: true
---


# Motivation
The query driver allows to query a resource for a subset of the values that it references. The query is parameterized by the repository holding the resource, the resource in question, and additional parameters which specify the subset of values from that resource that the query is addressing.

A typical application is to query a domain object in a bounded context for its current value. More generally, the query driver can be used to execute any command within a list of configured commands for a given configured context.

# API

## makeDomainQueryDriver :: Repository-> QueryConfig -> QueryDriver

### Description
Creates a **read-only** driver from a configuration object (called `config` here) and a repository (`repository`). The created driver holds a `getCurrent` property which is a function who takes two parameters : `context` and `payload`. 

The `context` is mapped to a `get` function through the `config` object. That `get` function is executed with `repository`, `context`, and `payload` as parameters.  That `get` function must return a `Promise`. 

To say the same things differently, the query driver allows to execute a `get` function with a given payload, that `get` function being parameterized by the `context` argument, as specified in the `config` object.

The behaviour is as follows :

- the `getCurrent` function in the `sources` side of the driver matches its `context` parameter 
to a `get` function in `config[context]`
- that function is executed with `(repository, context, payload)`
	- If the function throws, then the error is passed on through as a rejected promise
	- If the function does no throw, it returns either a promise, an observable, or another value
	 type
- the returned value is wrapped and passed on as a observable, whatever its original type

It results from the error processing behaviour of `getCurrent` that the caller must do its own error processing and discriminate between an exception raised by the call (say <q>division by zero</q>), or an error code returned by the attempt to access the resource in the repository (say <q>you are offline</q>, or <q>no user exists for this email</q>).

### Types
- `Repository :: *` -- typically would have a `get` function though
- `QueryConfig :: HashMap<Context, Record {get : GetFn}>`
- `GetFn :: Repository -> Context -> Payload -> Promise<*>`
- `QueryDriver :: Sink -> Record {getCurrent : QueryFn}`
- `QueryFn :: Context -> Payload -> Promise<*>`
- `Payload :: *`

### Contracts
- for every context passed as parameter to the `getCurrent` driver function, there MUST be a matching `config[context]` with a `get` property

# Example
cf. [AllInDemo](https://github.com/brucou/component-combinators/tree/master/examples/AllInDemo/src/domain) and the corresponding demo.

# Tips
- It is important to determine whether the queried value corresponds to a behaviour (that should be the case more often than not, so use `shareReplay(1)` or any relevant memoization mechanism) or an event
- In any case, only one value is ever returned by calling that function, i.e. the driver does not emulate a live query. To emulate a live query, there are commonly two options:
   - the query driver is paired with the action driver
   - the queried value is already a live query (that is the case for instance with `firebase` or 
   any database which already handles live queries)
