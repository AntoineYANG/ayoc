/*
 * @Author: Kyusho 
 * @Date: 2022-08-03 16:31:44 
 * @Last Modified by: Kyusho
 * @Last Modified time: 2022-08-03 22:36:22
 */

import { useRenderRoot } from './root';
import type Component from './component';
import useState from './hooks/use-state';


// 定义转译 JSX 的方法
// @see https://fettblog.eu/jsx-syntactic-sugar/


export {
  useRenderRoot,
  Component,
  useState,
};
