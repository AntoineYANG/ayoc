/*
 * @Author: Kyusho 
 * @Date: 2022-08-03 21:58:46 
 * @Last Modified by: Kyusho
 * @Last Modified time: 2022-08-12 00:06:00
 */

import hook from '.';
import useRef from './use-ref';
import diffDeps from './utils/diff-deps';


/**
 * 设置同步副作用.
 *
 * @param {() => (void | (() => void))} effect 副作用
 * @param {any[]} [deps] 依赖项列表
 */
const useLayoutEffect = (effect: () => (void | (() => void)), deps?: any[]): void => {
  let isInit = false;
  
  const depsRef = useRef(deps);
  const clearFuncRef = useRef<(() => void) | null>(null);

  const [apply, isVisible] = hook<[() => void, () => boolean]>(
    (self, getContext) => {
      isInit = true;

      const invoke = () => {
        let clearFunc: (() => void) | null = null;
        
        self.__DANGEROUS_COMPONENT_CONTEXT.effectQueue.willUnmount = (
          self.__DANGEROUS_COMPONENT_CONTEXT.effectQueue.willUnmount.filter(cb => {
            const isThisOne = cb === clearFuncRef.current;

            if (isThisOne) {
              clearFunc = cb;
            }

            return !isThisOne;
          })
        );

        (clearFunc as (() => void) | null)?.();
        clearFuncRef.current = effect() ?? null;

        if (clearFuncRef.current) {
          self.__DANGEROUS_COMPONENT_CONTEXT.effectQueue.willUnmount.push(clearFuncRef.current);
        }
      };
      
      return [
        () => {
          self.__DANGEROUS_COMPONENT_CONTEXT.effectQueue.whenRender.push(invoke);
        },
        () => self.__DANGEROUS_COMPONENT_CONTEXT.visible,
      ];
    }
  ).context;

  if ((isInit || !(isVisible())) || deps === undefined || (depsRef.current && diffDeps(deps, depsRef.current))) {
    apply();
  }
  
  depsRef.current = deps;
  
  return;
};


export default useLayoutEffect;
