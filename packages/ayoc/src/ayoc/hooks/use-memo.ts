/*
 * @Author: Kyusho 
 * @Date: 2022-08-03 21:58:46 
 * @Last Modified by: Kyusho
 * @Last Modified time: 2022-08-10 22:10:08
 */

import useRef from './use-ref';
import diffDeps from './utils/diff-deps';


/**
 * 获取可缓存的值.
 *
 * @template T
 * @param {() => T} factory 工厂函数
 * @param {any[]} deps 依赖项列表
 * @return {T} 被缓存的值
 */
const useMemo = <T>(factory: () => T, deps: any[]): T => {
  const funcRef = useRef(factory());
  const depsRef = useRef(deps);

  if (diffDeps(depsRef.current, deps)) {
    funcRef.current = factory();
    depsRef.current = deps;
  }
  
  return funcRef.current;
};


export default useMemo;
