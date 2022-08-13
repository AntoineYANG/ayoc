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
 * 这个 hook 的行为只与组件生命周期对齐，
 * 组件被展示或隐藏不会触发它的回调或清除函数.
 * 副作用将在组件实例第一次挂载时触发，
 * 其清除函数将在组件实例被销毁时触发.
 * 
 * 试图隐藏一个 dynamic 组件节点将使它和生命周期与它对齐的组件被销毁.
 *
 * @param {() => (void | (() => void))} effect 副作用
 * @param {any[]} [deps] 依赖项列表
 */
const useLifetimeEffect = (effect: () => (void | (() => void)), deps?: any[]): void => {
  let isInit = false;
  
  const depsRef = useRef(deps);
  const clearFuncRef = useRef<(() => void) | null>(null);

  const [apply] = hook<[() => void]>(
    (self, getContext) => {
      isInit = true;

      const invoke = () => {
        let clearFunc: (() => void) | null = null;
        
        self.__DANGEROUS_COMPONENT_CONTEXT.effectQueue.willDestroy = (
          self.__DANGEROUS_COMPONENT_CONTEXT.effectQueue.willDestroy.filter(cb => {
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
          self.__DANGEROUS_COMPONENT_CONTEXT.effectQueue.willDestroy.push(clearFuncRef.current);
        }
      };
      
      return [
        () => {
          self.__DANGEROUS_COMPONENT_CONTEXT.effectQueue.onRender.push(invoke);
        },
      ];
    }
  ).context;

  if (isInit || deps === undefined || (depsRef.current && diffDeps(deps, depsRef.current))) {
    apply();
  }
  
  depsRef.current = deps;
  
  return;
};


export default useLifetimeEffect;
