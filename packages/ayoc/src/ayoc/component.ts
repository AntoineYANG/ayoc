/*
 * @Author: Kyusho 
 * @Date: 2022-08-03 19:10:29 
 * @Last Modified by: Kyusho
 * @Last Modified time: 2022-08-13 23:22:59
 */

import { cacheNodes, generateTree, VirtualDOMNode } from './dom';
import type { RenderElement } from './jsx';


type Component<
  P extends Record<string | number | symbol, any> = {}
> = (props: Readonly<P>) => RenderElement;

/** 子组件缓存映射（通过源码中的位置与 key 匹配） */
export type ComponentMemoSet = Map<
  string,
  {
    /** 组件原型的引用，用于对比验证组件是否同型 */
    type: Component<any>;
    /** 传递 props 给组件，完成 render 和 dom 挂载 */
    renderer: RenderFunction<any>;
    /** 通知组件已被从视图上移除 */
    emitUnmount: () => void;
    /** 通知组件生命周期结束销毁实例 */
    emitDestroy: () => void;
  }
>;

export type Hook<C> = {
  context: C;
};

/**
 * 每个组件的上下文.
 */
export interface ComponentContext {
  root: Readonly<ComponentContext>;
  fireUpdate: (cb: () => void) => void;
  parent: Readonly<ComponentContext> | null;
  /** 子组件集合 */
  renderCache: ComponentMemoSet;
  children: ComponentContext[];
  __hooks: Hook<any[]>[];
  __DANGEROUS_COMPONENT_CONTEXT: {
    /** 当前 props */
    props: Readonly<Record<string | number | symbol, any>>;
    /** 组件是否被加载到视图 */
    visible: boolean;
    /** 是否是第一次渲染 */
    firstRender: boolean;
    /** 当前执行的 hook 索引值 */
    hookIdx: number;
    /** 是否跳过本次渲染（在 props 更新时可作用） */
    skipRender: boolean;
    /** 待执行的副作用 */
    effectQueue: {
      /** 渲染完成后异步执行 */
      onRender: (() => void)[];
      /** 渲染完成后同步执行 */
      whenRender: (() => void)[];
      /** 卸载前同步执行 */
      willUnmount: (() => void)[];
      /** 实例销毁前异步执行 */
      willDestroy: (() => void)[];
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
  root: Readonly<ComponentContext>,
  ownerRenderCache: ComponentMemoSet,
  parentRenderCache: ComponentMemoSet,
  parent: Readonly<ComponentContext>,
  component: Component<P>,
  key: string | number | null,
  where: string | null,
): RenderFunction<P> => {
  const id = where === null ? null : `<${component.name}/> at ${where};${
    key === null ? '' : `key ${typeof key === 'number' ? '=' : 'is'} ${key}`
  }`;

  if (id !== null) {
    if (ownerRenderCache?.has(id)) {
      const which = ownerRenderCache.get(id)!;

      if (which.type === component) {
        // console.log('got memoized', which);

        return which.renderer;
      }
    }
  }

  const context: ComponentContext = {
    root,
    fireUpdate: root.fireUpdate,
    parent,
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
      skipRender: false,
      hookIdx: 0,
      effectQueue: {
        onRender: [],
        whenRender: [],
        willUnmount: [],
        willDestroy: [],
      },
    },
    __DANGEROUS_UPDATE: () => {},
  };

  const dynamicComponentCache: typeof ownerRenderCache = new Map<string, {
    type: Component<any>;
    renderer: ReturnType<typeof useComponentNode>;
    emitUnmount: () => void;
    emitDestroy: () => void;
  }>();

  let $$slot: Element;
  
  const $$render = (): RenderElement => {
    if (context.__DANGEROUS_COMPONENT_CONTEXT.firstRender) {
      context.__DANGEROUS_COMPONENT_CONTEXT = {
        props: context.__DANGEROUS_COMPONENT_CONTEXT.props,
        visible: false,
        firstRender: true,
        skipRender: false,
        hookIdx: 0,
        effectQueue: {
          onRender: [],
          whenRender: [],
          willUnmount: [],
          willDestroy: [],
        },
      };
    }

    context.__DANGEROUS_COMPONENT_CONTEXT.hookIdx = 0;
    __DANGEROUS_CUR_COMPONENT_REF.current = context;
    const jsx = component(context.__DANGEROUS_COMPONENT_CONTEXT.props);
    __DANGEROUS_CUR_COMPONENT_REF.current = null;
    context.__DANGEROUS_COMPONENT_CONTEXT.firstRender = false;
    // console.log(context.__DANGEROUS_COMPONENT_CONTEXT, context.__hooks);

    return jsx;
  };

  /** 上次渲染结果 */
  // let prevRenderDom: VirtualDOMNode[] = [];
  const renderCache: Map<string, VirtualDOMNode> = new Map<string, VirtualDOMNode>();
  const childrenRenderCache: typeof parentRenderCache = new Map<string, {
    type: Component<any>;
    renderer: ReturnType<typeof useComponentNode>;
    emitUnmount: () => void;
    emitDestroy: () => void;
  }>();

  /** 完成 DOM 更新 */
  const $$apply = (element: RenderElement): void => {
    // console.log('render', $$slot, element);

    // prevRenderDom.forEach(e => e.ref.remove());

    // 卸载生命周期为 dynamic 的组件
    dynamicComponentCache.forEach(which => {
      which.emitDestroy();
    });
    dynamicComponentCache.clear();

    // console.log(component.name, 'cached children', childrenRenderCache);
    // console.log(parentRenderCache);

    // 记录未显示的组件，通知其标记为不可见
    const cachedComponentsVisible = new Map<string, boolean>(
      [...childrenRenderCache.keys()].map(id => [id, false]),
    );
        
    const dom = generateTree(
      context,
      $$slot,
      element,
      renderCache,
      childrenRenderCache,
      dynamicComponentCache,
      componentId => {
        cachedComponentsVisible.set(componentId, true);
      },
    );

    // console.log(component.name, 'cachedComponentsVisible', cachedComponentsVisible);
    // console.log(component.name, '', childComponentCache, cachedComponentsVisible);

    cachedComponentsVisible.forEach((visible, componentId) => {
      if (!visible) {
        const which = childrenRenderCache.get(componentId)!;
  
        which.emitUnmount();
      }
    });

    // 更新视图

    // console.log('dom', dom);

    renderCache.clear();

    dom.forEach(e => {
      $$slot.appendChild(e.ref);
    });

    cacheNodes(dom, renderCache);

    // prevRenderDom = dom;

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
    context.__DANGEROUS_COMPONENT_CONTEXT.skipRender = false;
    const element = $$render();

    context.fireUpdate(() => {
      $$apply(element);
    });
  };

  /** 由上层组件传递 props 触发更新 */
  const sendProps = (parent: Element, props: Readonly<P>): void => {
    $$slot = parent;
    context.__DANGEROUS_COMPONENT_CONTEXT.props = props;
    
    // console.log(`send props`, props);
    const element = $$render();

    // console.log('prevRenderDom', prevRenderDom);

    if (
      context.__DANGEROUS_COMPONENT_CONTEXT.visible
        && !context.__DANGEROUS_COMPONENT_CONTEXT.firstRender
        && context.__DANGEROUS_COMPONENT_CONTEXT.skipRender
    ) {
      context.__DANGEROUS_COMPONENT_CONTEXT.skipRender = false;
      // console.log('skipped!!!');

      // 跳过本次渲染
      
      return;
    }

    context.__DANGEROUS_COMPONENT_CONTEXT.skipRender = false;

    context.fireUpdate(() => {
      $$apply(element);
    });

    context.__DANGEROUS_COMPONENT_CONTEXT.visible = true;
    // console.log('visible', component.name, 'at', where);
  };

  /** 标记为不可见 */
  const emitUnmount = (): void => {
    if (context.__DANGEROUS_COMPONENT_CONTEXT.visible) {
      // console.log(component.name, 'invisible');
      context.__DANGEROUS_COMPONENT_CONTEXT.visible = false;

      // console.log(component.name, where, dynamicComponentCache);
      // 卸载生命周期为 dynamic 的组件
      dynamicComponentCache.forEach(which => {
        which.emitDestroy();
      });
      dynamicComponentCache.clear();

      // 优先深度遍历通知子组件不可见
      // console.log('ddd', childComponentCache)
      childrenRenderCache.forEach(which => {
        which.emitUnmount();
      });

      // console.log(context.__DANGEROUS_COMPONENT_CONTEXT.effectQueue.willUnmount);

      // 清除异步副作用
      const clearFuncs = (
        context.__DANGEROUS_COMPONENT_CONTEXT.effectQueue.willUnmount.splice(
          0, context.__DANGEROUS_COMPONENT_CONTEXT.effectQueue.willUnmount.length
        )
      );
      clearFuncs.forEach(cb => context.fireUpdate(cb));
    }
  };

  /** 标记为销毁 */
  const emitDestroy = (): void => {
    if (context.__DANGEROUS_COMPONENT_CONTEXT.visible) {
      emitUnmount();
    }

    // 清除异步副作用
    const clearFuncs = context.__DANGEROUS_COMPONENT_CONTEXT.effectQueue.willDestroy.splice(
      0, context.__DANGEROUS_COMPONENT_CONTEXT.effectQueue.willDestroy.length
    );
    clearFuncs.forEach(cb => context.fireUpdate(cb));

    // 卸载生命周期相同的子组件
    childrenRenderCache.forEach(which => {
      which.emitDestroy();
    });

    // 清除引用
    if (id !== null) {
      ownerRenderCache.delete(id);
      parentRenderCache.delete(id);
    }
  };

  // 缓存子组件到对应的上下文
  if (id !== null) {
    const self = {
      type: component,
      renderer: sendProps,
      emitUnmount,
      emitDestroy,
    };

    ownerRenderCache.set(id, self);
    parentRenderCache.set(id, self);
  }

  context.__DANGEROUS_UPDATE = $$renderAsRoot;

  return sendProps;
};


export default Component;
