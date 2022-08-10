/*
 * @Author: Kyusho 
 * @Date: 2022-08-03 21:58:46 
 * @Last Modified by: Kyusho
 * @Last Modified time: 2022-08-10 22:10:08
 */

import hook from '.';
import useRef from './use-ref';
import diffDeps from './utils/diff-deps';


/**
 * 设置副作用和它的清除函数.
 *
 * @param {() => (void | (() => void))} effect 副作用
 * @param {any[]} [deps] 依赖项列表
 */
const useEffect = (effect: () => (void | (() => void)), deps?: any[]): void => {
  const depsRef = useRef(deps);

  const [apply] = hook<[(effect: () => (void | (() => void))) => void]>(
    (self, getContext) => {
      return [
        ((): ((effect: () => (void | (() => void))) => void) => {
          const pushEffect = (cb: () => (void | (() => void))) => {
            self.__DANGEROUS_COMPONENT_CONTEXT.effectQueue.onRender.push(() => {
              const clear = cb();

              if (typeof clear === 'function') {
                self.__DANGEROUS_COMPONENT_CONTEXT.effectQueue[
                  Array.isArray(deps) && deps.length === 0 ? 'willUnmount' : 'beforeRender'
                ].push(clear);
              }
            });
          };

          if (Array.isArray(deps) && deps.length === 0) {
            pushEffect(effect);
          }

          return pushEffect;
        })()
      ];
    }
  ).context;

  if (depsRef.current === undefined || deps === undefined || diffDeps(depsRef.current, deps)) {
    apply(effect);
    depsRef.current = deps;
  }
  
  return;
};


export default useEffect;