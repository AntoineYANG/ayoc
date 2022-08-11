/*
 * @Author: Kyusho 
 * @Date: 2022-08-11 23:21:12 
 * @Last Modified by: Kyusho
 * @Last Modified time: 2022-08-11 23:56:27
 */

import type { ComponentMemoSet } from './component';


/**
 * 生命周期注解，用于标注子组件的生命周期.
 * 
 * 有效值：
 * + `"inherit"` - 子组件在父组件的生命周期内表现为不变的实例
 * + `"dynamic"` - 子组件随着父组件的每次渲染更新为不同的实例
 * + `"static"` - 子组件在整个渲染入口的生命周期内表现为不变的实例
 * + LifetimeFlag - 子组件在所标记的这个值的生命周期内表现为不变的实例
 * 
 * @default "inherit"
 */
export type LifetimeAnnotation = (
  | 'inherit'
  | 'dynamic'
  | 'static'
  | LifetimeFlag
);

export class LifetimeFlag {

  private readonly cacheSet: ComponentMemoSet;
  
  constructor(cacheSet: ComponentMemoSet) {
    this.cacheSet = cacheSet;
  }

  get renderCache() {
    return this.cacheSet;
  }

};
