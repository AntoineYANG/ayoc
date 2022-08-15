/*
 * @Author: Kyusho 
 * @Date: 2022-08-03 19:08:24 
 * @Last Modified by: Kyusho
 * @Last Modified time: 2022-08-15 20:20:07
 */

import type Component from './component';
import type { LifetimeAnnotation } from './lifetime';


const flag: unique symbol = Symbol('JSXElement');

export interface JSXElement<P extends Record<string | number | symbol, any> = any> {
  type: string | Component<P> | symbol;
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

export const createFragment = (children: any): JSXElement => {
  return {
    type: Fragment,
    props: {
      children,
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
const jsxProd = <P extends Record<string | number | symbol, any>>(
  type: string | Component<P>,
  props: Omit<JSXElement['props'], 'children'> & {
    children?: any;
  },
): JSXElement => {
  const children = ([] as any[]).concat(props.children);
  const { lifetime: _, ..._props } = props;

  return {
    type,
    props: {
      ..._props,
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
const jsxDev = <P extends Record<string | number | symbol, any>>(
  type: string | Component<P>,
  props: Omit<JSXElement['props'], 'children'> & {
    children?: any;
  },
): JSXElement => {
  const children = ([] as any[]).concat(props.children);
  const { lifetime: _, ..._props } = props;

  return {
    type,
    props: {
      ..._props,
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


const jsx = __DEV__ ? jsxDev : jsxProd;

export default jsx;
