/*
 * @Author: Kyusho 
 * @Date: 2022-08-03 21:58:46 
 * @Last Modified by: Kyusho
 * @Last Modified time: 2022-08-10 22:13:10
 */

import hook from '.';


export type RefObject<S> = {
  current: S;
};

/**
 * 获取一个在整个生命周期内能够缓存的值.
 *
 * @template S
 * @param {S} initValue 初始值
 * @return {RefObject<S>}
 */
const useRef = <S = any>(initValue: S): RefObject<S> => {
  return hook<[RefObject<S>]>(
    (self, getContext) => [{
      current: initValue
    }]
  ).context[0];
};


export default useRef;
