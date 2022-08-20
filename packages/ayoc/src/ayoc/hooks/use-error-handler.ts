/*
 * @Author: Kyusho 
 * @Date: 2022-08-20 23:34:43 
 * @Last Modified by: Kyusho
 * @Last Modified time: 2022-08-21 00:13:59
 */

import hook from '.';


/**
 * 捕获并处理在渲染过程中出现的异常.
 * 
 * 未捕获的异常会持续向上抛出，直到应用崩溃.
 *
 * @template E 异常类型
 * @template EC 异常构造器类型
 * @param {EC} type 异常类型
 * @param {(error: E) => void} handler 异常处理函数
 */
const useErrorHandler = <
  E extends Error,
  EC extends ErrorConstructor = ErrorConstructor,
>(type: EC, handler: (error: E) => void): void => {
  const [setHandler] = hook<[(type: EC, handler: (error: E) => void) => void, (error: E) => void]>(
    (self, getContext) => {
      return [
        (type: EC, handler: (error: E) => void): void => {
          const prev = getContext()[1];
          const whichIdx = self.__DANGEROUS_COMPONENT_CONTEXT.errorHandlers.findIndex(
            which => which.handler === prev
          );

          if (whichIdx !== -1) {
            self.__DANGEROUS_COMPONENT_CONTEXT.errorHandlers.splice(whichIdx, 1);
          }

          self.__DANGEROUS_COMPONENT_CONTEXT.errorHandlers.push({
            type,
            handler: handler as (error: Error) => void,
          });
        },
        handler,
      ];
    },
  ).context;

  setHandler(type, handler);
};


export default useErrorHandler;
