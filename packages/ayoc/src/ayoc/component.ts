/*
 * @Author: Kyusho 
 * @Date: 2022-08-03 19:10:29 
 * @Last Modified by: Kyusho
 * @Last Modified time: 2022-08-05 01:11:23
 */

import { cacheNodes, generateTree, VirtualDOMNode } from './dom';
import { JSXElement, RenderElement } from './jsx';


type Component<
  P extends Record<string | number | symbol, any> = {}
> = (props: Readonly<P>) => RenderElement;

/** 无 key 标识的一级子组件映射（通过源码中的位置匹配） */
type UnmarkedComponentMemoSet = Map<
  string,
  {
    type: Component<any>;
    renderer: RenderFunction<any>;
  }
>;
/** 有 key 标识的一级子组件映射 */
type MarkedComponentMemoSet = Map<
  Exclude<JSXElement['key'], null>,
  {
    type: Component<any>;
    renderer: RenderFunction<any>;
  }
>;

/** 所有一级子组件 */
type ComponentRefSet = {
  unmarked: UnmarkedComponentMemoSet;
  marked: MarkedComponentMemoSet;
};

export type Hook<C> = {
  context: C;
};

/**
 * 每个组件的上下文.
 */
export interface ComponentContext {
  fireUpdate: (cb: () => void) => void;
  parent: ComponentContext | null;
  /** 子组件集合 */
  componentRefs: ComponentRefSet;
  children: ComponentContext[];
  __hooks: Hook<any>[];
  __DANGEROUS_COMPONENT_CONTEXT: {
    /** 是否是第一次渲染 */
    firstRender: boolean;
    /** 当前执行的 hook 索引值 */
    hookIdx: number;
    /** 待执行的副作用 */
    effectQueue: {
      /** 渲染前异步执行 */
      beforeRender: (() => void)[];
      /** 渲染完成后异步执行 */
      onRender: (() => void)[];
      /** 渲染完成后同步执行 */
      whenRender: (() => void)[];
      /** 卸载前同步执行 */
      willUnmount: (() => void)[];
    };
  };
  __DANGEROUS_UPDATE: () => void;
}

type RenderFunction<P extends Record<string | number | symbol, any> = {}> = (
  parent: Element,
  props: Readonly<P>,
) => void;

export const __DANGEROUS_CUR_COMPONENT_REF: {
  current: ComponentContext | null;
} = {
  current: null,
};

export const useComponentNode = <P extends Record<string | number | symbol, any>>(
  owner: ComponentContext,
  component: Component<P>,
  key: string | number | null,
  where: string | null,
): RenderFunction<P> => {
  if (key !== null) {
    if (owner.componentRefs.marked.has(key)) {
      const which = owner.componentRefs.marked.get(key)!;
  
      if (which.type === component) {
        return which.renderer;
      }
    }
  } else {
    if (where !== null && owner.componentRefs.unmarked.has(where)) {
      const which = owner.componentRefs.unmarked.get(where)!;
  
      if (which?.type === component) {
        return which.renderer;
      }
    }
  }

  const context: ComponentContext = {
    fireUpdate: owner.fireUpdate,
    parent: owner,
    componentRefs: {
      unmarked: new Map<string, {
        type: Component<any>;
        renderer: ReturnType<typeof useComponentNode>;
      }>(),
      marked: new Map<Exclude<JSXElement['key'], null>, {
        type: Component<any>;
        renderer: ReturnType<typeof useComponentNode>;
      }>(),
    },
    children: [],
    __hooks: [],
    __DANGEROUS_COMPONENT_CONTEXT: {
      firstRender: true,
      hookIdx: 0,
      effectQueue: {
        beforeRender: [],
        onRender: [],
        whenRender: [],
        willUnmount: [],
      },
    },
    __DANGEROUS_UPDATE: () => {},
  };

  let $$slot: Element;

  let $$props: Readonly<P>;
  
  const $$render = (): RenderElement => {
    if (context.__DANGEROUS_COMPONENT_CONTEXT.firstRender) {
      context.__DANGEROUS_COMPONENT_CONTEXT = {
        firstRender: true,
        hookIdx: 0,
        effectQueue: {
          beforeRender: [],
          onRender: [],
          whenRender: [],
          willUnmount: [],
        },
      };
    }

    context.__DANGEROUS_COMPONENT_CONTEXT.hookIdx = 0;
    __DANGEROUS_CUR_COMPONENT_REF.current = context;
    const jsx = component($$props);
    __DANGEROUS_CUR_COMPONENT_REF.current = null;
    context.__DANGEROUS_COMPONENT_CONTEXT.firstRender = false;
    // console.log(context.__DANGEROUS_COMPONENT_CONTEXT, context.__hooks);

    return jsx;
  };

  /** 上次渲染结果 */
  let prevRenderDom: VirtualDOMNode[] = [];
  const renderCache: Map<string, VirtualDOMNode> = new Map<string, VirtualDOMNode>();

  /** 完成 DOM 更新 */
  const $$apply = (element: RenderElement): void => {
    // console.log('render', $$slot, element);

    // 清除异步副作用
    const effectClearFuncs = context.__DANGEROUS_COMPONENT_CONTEXT.effectQueue.beforeRender.splice(
      0, context.__DANGEROUS_COMPONENT_CONTEXT.effectQueue.beforeRender.length
    );
    effectClearFuncs.forEach(cb => context.fireUpdate(cb));

    // FIXME:
    prevRenderDom.forEach(e => e.ref.remove());
        
    const dom = generateTree(context, $$slot, element, renderCache);

    renderCache.clear();

    dom.forEach(e => {
      $$slot.appendChild(e.ref);
    });

    cacheNodes(dom, renderCache);

    prevRenderDom = dom;

    // 同步副作用
    const layoutEffects = context.__DANGEROUS_COMPONENT_CONTEXT.effectQueue.whenRender.splice(
      0, context.__DANGEROUS_COMPONENT_CONTEXT.effectQueue.whenRender.length
    );
    layoutEffects.forEach(cb => cb());
    
    // 异步副作用
    const renderEffects = context.__DANGEROUS_COMPONENT_CONTEXT.effectQueue.onRender.splice(
      0, context.__DANGEROUS_COMPONENT_CONTEXT.effectQueue.onRender.length
    );
    renderEffects.forEach(cb => context.fireUpdate(cb));
  };

  /** 由自身触发更新 */
  const $$renderAsRoot = (): void => {
    // console.log('update', context.__hooks);
    const element = $$render();

    owner.fireUpdate(() => {
      $$apply(element);
    });
  };

  /** 由上层组件传递 props 触发更新 */
  const sendProps = (parent: Element, props: Readonly<P>): void => {
    $$slot = parent;
    $$props = props;
    // console.log(`send props`, props);
    const element = $$render();

    owner.fireUpdate(() => {
      $$apply(element);
    });
  };

  // 缓存子组件到父组件上下文
  if (key !== null) {
    owner.componentRefs.marked.set(key, {
      type: component,
      renderer: sendProps,
    });
  } else if (where) {
    owner.componentRefs.unmarked.set(where, {
      type: component,
      renderer: sendProps,
    });
  }

  context.__DANGEROUS_UPDATE = $$renderAsRoot;

  return sendProps;
};


export default Component;
