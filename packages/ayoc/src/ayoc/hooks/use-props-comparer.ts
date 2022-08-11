/*
 * @Author: Kyusho 
 * @Date: 2022-08-11 22:29:25 
 * @Last Modified by: Kyusho
 * @Last Modified time: 2022-08-11 23:09:33
 */

import hook from '.';
import useRef from './use-ref';


const usePropsComparerSymbol: unique symbol = Symbol('usePropsComparer');

/**
 * 设定一个函数来对比更新前后的 props，
 * 回调函数返回 `true` 时表示两次的 props 相同，
 * ayoc 将跳过对这个组件的更新.
 * 
 * 这个 hook 不允许在一个组件内被多处调用.
 * 
 * 建议在所有其他 hook 之前调用这个 hook.
 *
 * @template P
 * @param {(prevProps: Readonly<P>, nextProps: Readonly<P>) => boolean} propsAreEqual 对比函数，仅会保留第一次传入的值
 */
const usePropsComparer = <
  P extends Record<string | number | symbol, any>,
  PWithChildren extends P & { children: any[] } = P & { children: any[] },
>(
  propsAreEqual: (prevProps: Readonly<PWithChildren>, nextProps: Readonly<PWithChildren>) => boolean
): void => {
  const validRef = useRef(true);
  const { current: comparer } = useRef(propsAreEqual);
  const prevPropsRef = useRef<Readonly<P> | null>(null);

  const [, getProps, skipRender] = hook<[typeof usePropsComparerSymbol, () => Readonly<P>, () => void]>(
    (self, getContext) => {
      if (self.__hooks.find(({ context: hookCtx }) => hookCtx[0] === usePropsComparerSymbol)) {
        // 已经调用过

        console.error(new Error('usePropsComparer() can only be called once in one component.'));
        validRef.current = false;
      } else if (self.__hooks.length > 3) {
        // 这里已经有了三个 useRef() 各创建了一次上下文，
        // 所以如果这个 hook 是第一个被调用的 hook 的话，
        // 这里看到的 __hooks 的长度应该为 3。
        console.warn(new Error('usePropsComparer() is supposed to be the first hook in a component.'));
      }

      return [
        usePropsComparerSymbol,
        () => self.__DANGEROUS_COMPONENT_CONTEXT.props,
        () => self.__DANGEROUS_COMPONENT_CONTEXT.skipRender = true,
      ];
    }
  ).context;

  const props = getProps();

  if (validRef.current && prevPropsRef.current) {
    if (comparer(prevPropsRef.current, props)) {
      skipRender();
    }
  }

  prevPropsRef.current = props;
};


export default usePropsComparer;
