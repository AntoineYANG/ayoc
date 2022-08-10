/*
 * @Author: Kyusho 
 * @Date: 2022-08-10 21:31:31 
 * @Last Modified by: Kyusho
 * @Last Modified time: 2022-08-10 22:13:48
 */

/**
 * 对比两个依赖项数组.
 *
 * @param {any[] | undefined} prev 前一个渲染周期的依赖项数组
 * @param {any[]} next 后一个渲染周期的依赖项数组
 * @return {boolean} 是否有依赖项发生改变
 */
const diffDeps = (prev: any[] | undefined, next: any[]): boolean => {
  if (prev === undefined) {
    return true;
  }
  
  if (prev.length !== next.length) {
    console.error(new Error('Array `deps` cannot be dynamic, however arrays of different lengths are found.'));

    return true;
  }

  for (let i = 0; i < prev.length; i += 1) {
    if (prev[i] !== next[i]) {
      return true;
    }
  }

  return false;
};


export default diffDeps;
