/*
 * @Author: Kyusho 
 * @Date: 2022-08-03 21:58:46 
 * @Last Modified by: Kyusho
 * @Last Modified time: 2022-08-05 01:01:13
 */

import hook from '.';


export type StateSetter<S = any> = (state: S) => void;

const useState = <S = any>(initState: S): [Readonly<S>, StateSetter<S>] => {
  return hook<[Readonly<S>, StateSetter<S>]>(
    (self, getContext) => [
      initState,
      val => {
        const ctx = getContext();
        console.log(ctx[0], '=>', val);

        ctx[0] = val;

        self.__DANGEROUS_UPDATE();
      }
    ]
  ).context;
};


export default useState;
