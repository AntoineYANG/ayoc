/*
 * @Author: Kyusho 
 * @Date: 2022-08-13 23:07:04 
 * @Last Modified by: Kyusho
 * @Last Modified time: 2022-08-13 23:16:59
 */

import useMemo from './use-memo';


const uuid = (() => {
  let cursor: bigint = BigInt(0);

  return (): string => {
    const id = `ayoc+id+${cursor}`;

    cursor = cursor + BigInt(1);

    return id;
  };
})();

/**
 * 返回一个可用作 HTML id 属性的全局不重复字符串.
 *
 * @param {string} [template] 定义返回字符串的形式，仅在第一次传入时生效
 * @returns {string}
 */
const useId = (template?: `${string}[id]${string}`): string => {
  return useMemo(() => {
    return (template ?? '[id]').replace('[id]', uuid());
  }, []);
};


export default useId;
