/*
 * @Author: Kyusho 
 * @Date: 2022-08-03 21:58:46 
 * @Last Modified by: Kyusho
 * @Last Modified time: 2022-08-10 22:10:08
 */

import useRef from './use-ref';
import diffDeps from './utils/diff-deps';


/**
 * 获取可缓存的函数.
 *
 * @template F
 * @param {() => F} factory 函数构建器
 * @param {any[]} deps 依赖项列表
 * @return {F} 被缓存的函数
 */
const useCallback = <F extends (...args: any) => any>(factory: () => F, deps: any[]): F => {
  const funcRef = useRef(factory());
  const depsRef = useRef(deps);

  if (diffDeps(depsRef.current, deps)) {
    funcRef.current = factory();
    depsRef.current = deps;
  }
  
  return funcRef.current;
};


export default useCallback;
