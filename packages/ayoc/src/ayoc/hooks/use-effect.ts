/*
 * @Author: Kyusho 
 * @Date: 2022-08-03 21:58:46 
 * @Last Modified by: Kyusho
 * @Last Modified time: 2022-08-12 00:26:54
 */

import hook from '.';
import useRef from './use-ref';
import diffDeps from './utils/diff-deps';


/**
 * 设置副作用和它的清除函数.
 *
 * @param {() => (void | (() => void))} effect 副作用
 * @param {any[] | undefined} [deps] 依赖项列表
 */
const useEffect = (effect: () => (void | (() => void)), deps?: any[] | undefined): void => {
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
          self.__DANGEROUS_COMPONENT_CONTEXT.effectQueue.onRender.push(invoke);
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


export default useEffect;
