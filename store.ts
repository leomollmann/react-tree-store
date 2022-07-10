import { useEffect, useState } from 'react';
import _ from 'lodash';
import { Path, PathValue } from 'react-hook-form';

/** Custom state management
 * @author leonardo.scholler(at)poatek.com
 */
function Store<State>(initial: State) {
  const always = (x: boolean) => !x;
  let state = _.cloneDeep(initial);
  let queued = false;
  const listeners = new Set<() => void>();

  function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  /** hook to subscribe to any of the state's attributes changes
   * @param path path to attribute, can be a nested path, autocompleted by typescrit
   * @returns the attribute
   * @example const property = useObserver('property')
   */
  function useSubtree<P extends Path<State>>(path: P): PathValue<State, P> {
    const forceUpdate = useState(false)[1];

    useEffect(() => {
      let oldEncoding = _.get(state, path);

      return subscribe(() => {
        const newEncoding = _.get(state, path);
        if (newEncoding === oldEncoding) return;
        oldEncoding = newEncoding;

        forceUpdate(always);
      });
    }, [path]);

    return _.get(state, path);
  }

  /** hook to subscribe to any changes in the store
   * @returns the store's state
   * @example const store = useStore()
   */
  function useTree(): State {
    const forceUpdate = useState(false)[1];

    useEffect(() => {
      return subscribe(() => forceUpdate(always));
    }, []);

    return state;
  }

  /** queue all updates, once per render cycle.
   * update observers when the event loop is free
   */
  function notify() {
    if (!queued) {
      queued = true;
      setTimeout(() => {
        listeners.forEach(f => f());
        queued = false;
      }, 0);
    }
  }

  /** get the state wihtout subscribing */
  function getTree() {
    return state;
  }

  /** reset the store to the initial value */
  function reset() {
    state = _.cloneDeep(initial);
    notify();
  }

  /** set the state with a new partial value */
  function set(fork: Partial<State>) {
    state = _.assign(state, fork);
    notify();
  }

  return {
    getTree,
    useSubtree,
    useTree,
    notify,
    reset,
    set,
  };
}

export default Store;