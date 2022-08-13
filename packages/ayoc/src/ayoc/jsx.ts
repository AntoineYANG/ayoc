/*
 * @Author: Kyusho 
 * @Date: 2022-08-03 19:08:24 
 * @Last Modified by: Kyusho
 * @Last Modified time: 2022-08-11 23:54:08
 */

import type Component from './component';
import type { LifetimeAnnotation } from './lifetime';


const flag: unique symbol = Symbol('JSXElement');

export interface JSXElement {
  type: string | Component | symbol;
  props: {
    children: JSXElement[];
    nodeValue?: any;
    lifetime?: LifetimeAnnotation;
  } & Record<string | number | symbol, any>;
  key: number | string | null;

  // private
  
  flag?: typeof flag;
  where?: string;
}

declare global {
  namespace JSX {
    interface IntrinsicAttributes {
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
      lifetime?: LifetimeAnnotation;
    }
  }
}

export const isJSXElement = (obj: any): boolean => {
  return typeof obj === 'object' && obj['flag'] === flag;
};

export const Fragment: unique symbol = Symbol('Fragment');

export const TextElement: unique symbol = Symbol('TextElement');

export type RenderElement = (
  | JSXElement
  | null
);

export const createTextNode = (data: unknown): JSXElement => {
  return {
    type: TextElement,
    props: {
      nodeValue: `${data}`,
      children: [],
    },
    flag,
    key: null,
  };
};

const __DANGEROUSLY_GET_CUR_JSX_POSITION = (): string => {
  const position = new Error().stack!.split(/\n\s*/)[3]!.replace(/^at /, '');
  
  return position;
};

/**
 * Create element.
 */
const jsxProd = (
  type: string | Component,
  props: Omit<JSXElement['props'], 'children'> & {
    children?: any;
  },
): JSXElement => {
  const children = ([] as any[]).concat(props.children);

  return {
    type,
    props: {
      ...props,
      children: children.map(child => (
        typeof child === 'object' ? child : createTextNode(child)
      )) ?? [],
    },
    flag,
    key: props['key'] ?? null,
    where: __DANGEROUSLY_GET_CUR_JSX_POSITION(),
  };
};

/**
 * Create element.
 */
const jsxDev = (
  type: string | Component,
  props: Omit<JSXElement['props'], 'children'> & {
    children?: any;
  },
): JSXElement => {
  const children = ([] as any[]).concat(props.children);

  return {
    type,
    props: {
      ...props,
      children: children.map(child => (
        typeof child === 'object' ? child
          : typeof child === 'string' || typeof child === 'number' ? createTextNode(child)
            : null
      )).filter(Boolean) ?? [],
    },
    flag,
    key: props['key'] ?? null,
    where: __DANGEROUSLY_GET_CUR_JSX_POSITION(),
  };
};

export type KeyMap = Map<string | number, Element>;

export const applyJSX = (
  parent: Element,
  jsx: JSXElement | JSXElement[],
  keyMap: KeyMap,
): void => {
  const data = ([] as JSXElement[]).concat(jsx);

  for (const child of parent.childNodes) {
    child.remove();
  }

  let cursor = 0;
  
  const nextChildren = data.reduce<[ChildNode, JSXElement[]][]>((list, jsx) => {
    if (jsx.type === TextElement && jsx.props.nodeValue) {
      // 文字节点
      return [...list, [new Text(jsx.props.nodeValue), jsx.props.children]];
    }
    
    if (typeof jsx.type !== 'string') {
      return list;
    }

    const which: Element | null = jsx.key !== null ? (keyMap.get(jsx.key) ?? null) : parent.children.item(cursor++);
    const { nodeValue, children, ...p } = jsx.props;
    const { style = {}, ...props } = p;

    if (which) {
      // 更新这个节点
      for (const key in props) {
        if (Object.prototype.hasOwnProperty.call(props, key)) {
          const prevVal = which.getAttribute(key);
          const nextVal = props[key];
          
          if (prevVal !== nextVal) {
            which.setAttribute(key, nextVal);
          }
        }
      }

      for (const key in style) {
        if (Object.prototype.hasOwnProperty.call(style, key) && key in (which as HTMLElement).style) {
          const nextVal = style[key];
          (which as HTMLElement).style[key as Exclude<keyof CSSStyleDeclaration, 'length' | 'parentRule'>] = nextVal;
        }
      }

      if (jsx.key !== null) {
        keyMap.set(jsx.key, which);
      }

      return [...list, [which, jsx.props.children]];
    }

    // 新建节点
    const ele: HTMLElement = document.createElement(jsx.type as string);

    for (const key in props) {
      if (Object.prototype.hasOwnProperty.call(props, key)) {
        const nextVal = props[key];
        ele.setAttribute(key, nextVal);
      }
    }

    for (const key in style) {
      if (Object.prototype.hasOwnProperty.call(style, key) && key in ele.style) {
        const nextVal = style[key];
        ele.style[key as Exclude<keyof CSSStyleDeclaration, 'length' | 'parentRule'>] = nextVal;
      }
    }

    return [...list, [ele, jsx.props.children]];
  }, []);

  nextChildren.forEach(([node, children]) => {
    parent.appendChild(node);

    if (children.length > 0) {
      applyJSX(node as Element, children, keyMap);
    }
  });
};


const jsx = __DEV__ ? jsxDev : jsxProd;

export default jsx;
