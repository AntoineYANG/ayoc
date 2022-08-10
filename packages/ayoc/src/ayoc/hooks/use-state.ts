/*
 * @Author: Kyusho 
 * @Date: 2022-08-03 21:58:46 
 * @Last Modified by: Kyusho
 * @Last Modified time: 2022-08-10 22:13:10
 */

import hook from '.';


export type StateSetter<S> = {
  from: (transformer: (prevState: Readonly<S>) => S) => void;
  (state: S): void;
};

export type UseStateOptions<S> = Partial<{
  /** 判断是否需要触发更新 */
  shouldUpdate: (
    | 'pure'
    | ((prevVal: Readonly<S>, nextVal: Readonly<S>) => boolean)
  );
}>;

/**
 * 获取一个 state 及它的修改函数.
 *
 * @template S
 * @param {S} initState 初始值
 * @param {UseStateOptions<S>} options 配置项
 * @return {[Readonly<S>, StateSetter<S>]}
 */
const useState = <S>(initState: S, options?: UseStateOptions<S>): [Readonly<S>, StateSetter<S>] => {
  const [state, setState] = hook<[Readonly<S>, StateSetter<S>, (prevVal: Readonly<S>, nextVal: Readonly<S>) => boolean]>(
    (self, getContext) => [
      initState,
      Object.assign(
        function setState (state: S): void {
          const ctx = getContext();
  
          const prevVal = ctx[0];
          ctx[0] = state;

          const shouldUpdate = ctx[2];
  
          if (shouldUpdate(prevVal, ctx[0])) {
            self.__DANGEROUS_UPDATE();
          }
        },
        {
          from: (transformer: (prevState: Readonly<S>) => S): void => {
            const ctx = getContext();

            const prevVal = ctx[0];
            ctx[0] = transformer(ctx[0]);

            const shouldUpdate = ctx[2];

            if (shouldUpdate(prevVal, ctx[0])) {
              self.__DANGEROUS_UPDATE();
            }
          }
        }
      ),
      ((): ((prevVal: Readonly<S>, nextVal: Readonly<S>) => boolean) => {
        if (options?.shouldUpdate) {
          if (options.shouldUpdate === 'pure') {
            return (prevVal, nextVal) => !Object.is(prevVal, nextVal);
          }

          return options.shouldUpdate;
        }

        return () => true;
      })(),
    ]
  ).context;

  return [state, setState];
};


export default useState;
