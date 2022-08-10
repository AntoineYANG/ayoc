/*
 * @Author: Kyusho 
 * @Date: 2022-08-04 19:16:28 
 * @Last Modified by: Kyusho
 * @Last Modified time: 2022-08-04 19:17:36
 */

const isValidElementType = (element: any): boolean => {
  return ['function', 'string'].includes(typeof element);
};


export default isValidElementType;
