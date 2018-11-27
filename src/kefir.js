import Observable from 'kefir/src/observable'
import Stream from 'kefir/src/stream'
import Property from 'kefir/src/property'

// Create a stream
// -----------------------------------------------------------------------------

// Target = {addEventListener, removeEventListener}|{addListener, removeListener}|{on, off}
// (Target, string, Function|undefined) -> Stream
import fromEvents from 'kefir/src/primary/from-events'

// (Function) -> Stream
import stream from 'kefir/src/primary/stream'

// Create a property
// -----------------------------------------------------------------------------

// Modify an observable
// -----------------------------------------------------------------------------

// (Stream, Function|undefined) -> Stream
// (Property, Function|undefined) -> Property
import map from 'kefir/src/one-source/map'
Observable.prototype.map = function(fn) {
  return map(this, fn)
}

// (Stream, Function|undefined) -> Stream
// (Property, Function|undefined) -> Property
import filter from 'kefir/src/one-source/filter'
Observable.prototype.filter = function(fn) {
  return filter(this, fn)
}


// Options = {immediate: boolean|undefined}
// (Stream, number, Options|undefined) -> Stream
// (Property, number, Options|undefined) -> Property
import debounce from 'kefir/src/one-source/debounce'
Observable.prototype.debounce = function(wait, options) {
  return debounce(this, wait, options)
}


// Combine observables
// -----------------------------------------------------------------------------

// (Array<Stream|Property>) -> Stream
import merge from 'kefir/src/many-sources/merge'
Observable.prototype.merge = function(other) {
  return merge([this, other])
}


// Exports
// --------------------------------------------------------------------------

const Kefir = {
  fromEvents,
  stream,
  merge,
}

Kefir.Kefir = Kefir

export {
  Kefir,
  fromEvents,
  stream,
  merge,
}

export default Kefir
