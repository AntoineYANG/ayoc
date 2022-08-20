/*
 * @Author: Kyusho 
 * @Date: 2022-08-03 16:34:01 
 * @Last Modified by: Kyusho
 * @Last Modified time: 2022-08-21 01:33:01
 */

import Component, {
  AyocRenderError,
  ComponentContext,
  useComponentNode,
} from './component';
import type { JSXElement } from './jsx';


type RootRenderFunction = (element: JSXElement) => void;

/** 同步执行更新操作的最大次数 */
const MAX_CONCURRENT = 64;

/**
 * 创建渲染根节点.
 *
 * @param {HTMLElement} rootElement 作为容器的DOM元素
 * @return {RootRenderFunction} 渲染函数
 */
export const useRenderRoot = (rootElement: HTMLElement): RootRenderFunction => {
  const { childElementCount } = rootElement;
  
  if (childElementCount > 0) {
    throw new Error('Cannot create root on a nonempty node.');
  }

  const updateArr: (() => void)[] = [];

  let updateDirty = false;

  const invokeUpdate = (): void => {
    if (updateDirty && updateArr.length > 0) {
      const arr = updateArr.splice(0, MAX_CONCURRENT);

      arr.forEach(cb => cb());

      if (updateArr.length > 0) {
        requestAnimationFrame(invokeUpdate);
      } else {
        updateDirty = false;
      }
    }
  };

  const fireUpdate = (cb: () => void): void => {
    updateArr.push(cb);

    if (!updateDirty) {
      updateDirty = true;

      requestAnimationFrame(invokeUpdate);
    }
  };
  
  const render: RootRenderFunction = element => {
    const context: ComponentContext = {
      root: undefined as unknown as ComponentContext,
      fireUpdate,
      raiseError: (error, from, stack) => {
        // 没有拦截：应用崩溃
        console.error(error);

        // unmount
        context.__DANGEROUS_COMPONENT_CONTEXT.visible = false;
        requestAnimationFrame(() => {
          context.renderCache.forEach(which => {
            which.emitDestroy();
          });
        });

        throw new AyocRenderError(
          from,
          stack,
          {
            cause: error,
          }
        );
      },
      parent: null,
      renderCache: new Map<string, {
        type: Component<any>;
        renderer: ReturnType<typeof useComponentNode>;
        emitUnmount: () => void;
        emitDestroy: () => void;
      }>(),
      children: [],
      __hooks: [],
      __DANGEROUS_COMPONENT_CONTEXT: {
        props: undefined as unknown as Readonly<Record<string | number | symbol, any>>,
        visible: false,
        firstRender: true,
        hookIdx: 0,
        skipRender: false,
        effectQueue: {
          onRender: [],
          whenRender: [],
          willUnmount: [],
          willDestroy: [],
        },
        errorHandlers: [],
      },
      __DANGEROUS_UPDATE: () => {},
    };

    context.root = context;
    
    const root = useComponentNode(
      context,
      context.renderCache,
      new Map<string, {
        type: Component<any>;
        renderer: ReturnType<typeof useComponentNode>;
        emitUnmount: () => void;
        emitDestroy: () => void;
      }>(),
      context,
      function AyocRoot () { return element },
      null,
      new Error().stack?.split('\n')[2]?.replace(/^    at /, '') ?? '(root)',
    );

    console.log('->', new Error().stack?.split('\n')[2]);

    root(rootElement, 0, {});

    context.__DANGEROUS_COMPONENT_CONTEXT.visible = true;
  };

  return render;
};
