/*
 * @Author: Kyusho 
 * @Date: 2022-08-05 00:14:43 
 * @Last Modified by: Kyusho
 * @Last Modified time: 2022-08-10 22:00:27
 */

import { ComponentContext, Hook, __DANGEROUS_CUR_COMPONENT_REF } from '../component';


const hook = <C extends any[]>(
  initContext: (component: ComponentContext, getContext: () => C) => C,
): Hook<C> => {
  const which = __DANGEROUS_CUR_COMPONENT_REF.current;

  if (!which) {
    throw new Error('Cannot find the corresponding component context!');
  }

  if (which.__DANGEROUS_COMPONENT_CONTEXT.firstRender) {
    const hook: Hook<C> = {
      context: initContext(which, () => hook.context),
    };

    which.__hooks.push(hook);

    return hook;
  }

  const self = which.__hooks[which.__DANGEROUS_COMPONENT_CONTEXT.hookIdx++]! as Hook<C>;

  return self;
};


export default hook;
