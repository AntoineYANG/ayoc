/*
 * @Author: Kyusho 
 * @Date: 2022-08-03 19:10:29 
 * @Last Modified by: Kyusho
 * @Last Modified time: 2022-08-05 01:11:23
 */

import { compareTree, VirtualDOMNode } from './dom';
import { JSXElement, RenderElement } from './jsx';


type Component<
  P extends Record<string | number | symbol, any> = {}
> = (props: Readonly<P>) => RenderElement;

/** 无 key 标识的一级子组件列表 */
type UnmarkedComponentMemoArr = {
  type: Component<any>;
  renderer: RenderFunction<any>;
}[];
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
  unmarked: UnmarkedComponentMemoArr;
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
    /** 当前解析的非具名子组件索引值 */
    cursor: number;
    /** 是否是第一次渲染 */
    firstRender: boolean;
    /** 当前执行的 hook 索引值 */
    hookIdx: number;
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
): RenderFunction<P> => {
  if (key !== null && owner.componentRefs.marked.has(key)) {
    const which = owner.componentRefs.marked.get(key)!;

    if (which.type === component) {
      return which.renderer;
    }
  } else {
    const index = owner.__DANGEROUS_COMPONENT_CONTEXT.cursor;
    const which = owner.componentRefs.unmarked[index];

    if (which?.type === component) {
      owner.__DANGEROUS_COMPONENT_CONTEXT.cursor += 1;

      return which.renderer;
    }
  }

  const context: ComponentContext = {
    fireUpdate: owner.fireUpdate,
    parent: owner,
    componentRefs: {
      unmarked: [],
      marked: new Map<Exclude<JSXElement['key'], null>, {
        type: Component<any>;
        renderer: ReturnType<typeof useComponentNode>;
      }>(),
    },
    children: [],
    __hooks: [],
    __DANGEROUS_COMPONENT_CONTEXT: {
      cursor: 0,
      firstRender: true,
      hookIdx: 0,
    },
    __DANGEROUS_UPDATE: () => {},
  };

  let $$slot: Element;

  let $$props: Readonly<P>;
  
  const $$render = (): RenderElement => {
    context.__DANGEROUS_COMPONENT_CONTEXT.hookIdx = 0;
    __DANGEROUS_CUR_COMPONENT_REF.current = context;
    const jsx = component($$props);
    __DANGEROUS_CUR_COMPONENT_REF.current = null;
    context.__DANGEROUS_COMPONENT_CONTEXT.firstRender = false;
    console.log(context.__DANGEROUS_COMPONENT_CONTEXT, context.__hooks)

    return jsx;
  };

  /** 上次渲染结果 */
  let prevRenderTree: RenderElement = null;
  let prevRenderDom: VirtualDOMNode[] = [];

  /** 完成 DOM 更新 */
  const $$apply = (element: RenderElement): void => {
    console.log('render', $$slot, element);
    context.__DANGEROUS_COMPONENT_CONTEXT.cursor = 0;

    // FIXME:
    prevRenderDom.forEach(e => e.ref.remove());
        
    const dom = compareTree(context, $$slot, prevRenderTree, element);

    dom.forEach(e => {
      $$slot.appendChild(e.ref);
    });

    prevRenderTree = element;
    prevRenderDom = dom;
  };

  /** 由自身触发更新 */
  const $$renderAsRoot = (): void => {
    console.log('update', context.__hooks);
    const element = $$render();

    owner.fireUpdate(() => {
      $$apply(element);
    });
  };

  /** 由上层组件传递 props 触发更新 */
  const sendProps = (parent: Element, props: Readonly<P>): void => {
    $$slot = parent;
    $$props = props;
    console.log(`send props`, props);
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
  } else {
    owner.componentRefs.unmarked = [
      ...owner.componentRefs.unmarked.slice(0, owner.__DANGEROUS_COMPONENT_CONTEXT.cursor),
      {
        type: component,
        renderer: sendProps,
      },
      ...owner.componentRefs.unmarked.slice(owner.__DANGEROUS_COMPONENT_CONTEXT.cursor ++),
    ];
  }

  context.__DANGEROUS_UPDATE = $$renderAsRoot;

  return sendProps;
};

// /**
//  * 具有渲染能力的组件维护实例.
//  */
// export class AliveElement<P extends Record<string | number | symbol, any> = {}> {

//   protected readonly component: Component<P>;

//   protected readonly keyMap: Map<string, Element>;

//   protected readonly childrenCache: Map<string, [Component, AliveElement]>;

//   protected readonly hookArr: HookData[];

//   constructor(component: Component<P>) {
//     this.component = component;
//     this.keyMap = new Map<string, Element>();
//     this.childrenCache = new Map<string, [Component, AliveElement]>();
//     this.hookArr = [];
//   }

//   private resolveComponent(parent: Element, jsx: JSXElement[], path: string): JSXElement[] {
//     return jsx.map<JSXElement>((d, i) => {
//       const id = `${path}/${d.key ?? i}`;
//       const which = this.childrenCache.get(id);

//       let res = d;

//       if (typeof d.type === 'function') {
//         if (which && which[0] === d.type) {
//           const component = which[1];
  
//           component.render(parent, d.props);
//         } else {
//           const component = new AliveElement(d.type);
  
//           component.render(parent, d.props);

//           this.childrenCache.set(id, [d.type, component]);
//         }
//       } else if (res.props.children.length > 0) {
//         res.props.children = this.resolveComponent(parent, res.props.children, id);
//       }

//       return res;
//     });
//   }

//   render(parent: Element, props: Readonly<P>): void {
//     curNode = this;
//     const jsx = this.component(props);
//     curNode = null;

//     applyJSX(parent, jsx, this.keyMap);
//     this.resolveComponent(parent, [jsx], '');
//   }

// }


export default Component;
