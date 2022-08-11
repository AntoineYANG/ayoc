/*
 * @Author: Kyusho 
 * @Date: 2022-08-12 00:12:26 
 * @Last Modified by: Kyusho
 * @Last Modified time: 2022-08-12 00:15:43
 */

import hook from '.';
import { LifetimeFlag } from '../lifetime';


/**
 * 获取一个上下文对象用于向子组件共享生命周期. 
 *
 * @return {LifetimeFlag}
 */
const useLifetimeFlag = (): LifetimeFlag => {
  return hook<[LifetimeFlag]>(
    (self, getContext) => [
      new LifetimeFlag(self.renderCache),
    ]
  ).context[0];
};


export default useLifetimeFlag;
