/*
 * @Author: Kyusho 
 * @Date: 2022-08-15 19:25:20 
 * @Last Modified by: Kyusho
 * @Last Modified time: 2022-08-15 19:36:20
 */

import type Component from '../component';
import { createFragment } from '../jsx';


export type FragmentType = Component<{}>;

const Fragment: FragmentType = ({ children }) => {
  return createFragment(children);
};


export default Fragment;
