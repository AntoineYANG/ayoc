/*
 * @Author: Kyusho 
 * @Date: 2022-08-03 21:58:46 
 * @Last Modified by: Kyusho
 * @Last Modified time: 2022-08-05 01:01:13
 */

import hook from '.';


export type RebuildFunction = () => void;

/**
 * 获取一个函数用于强制清空并重新初始化所有组件上下文.
 *
 * @return {RebuildFunction}
 */
const useRebuild = (): RebuildFunction => {
  return hook<[RebuildFunction]>(
    (self, getContext) => [
      () => {
        self.__hooks = [];
        self.__DANGEROUS_COMPONENT_CONTEXT.firstRender = true;

        // 通知卸载
        const clearFuncs = (
          self.__DANGEROUS_COMPONENT_CONTEXT.effectQueue.willUnmount.splice(
            0, self.__DANGEROUS_COMPONENT_CONTEXT.effectQueue.willUnmount.length
          )
        );
        clearFuncs.forEach(cb => self.fireUpdate(cb));

        self.__DANGEROUS_UPDATE();
      }
    ]
  ).context[0];
};


export default useRebuild;
