/*
 * @Author: Kyusho 
 * @Date: 2022-08-03 19:08:24 
 * @Last Modified by: Kyusho
 * @Last Modified time: 2022-08-05 00:06:48
 */

import type Component from './component';
import isValidElementType from './utils/is-valid-element-type';


const flag: unique symbol = Symbol('JSXElement');

export interface JSXElement {
  type: string | Component | symbol;
  props: {
    children: JSXElement[];
    nodeValue?: any;
  } & Record<string | number | symbol, any>;
  key: number | string | null;

  // private
  
  flag?: typeof flag;
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

// export const jsxWithValidation = <P extends Record<string | number | symbol, any>>(
//   type: string | Component,
//   props: Readonly<P>,
//   key: string | number | null,
//   isStaticChildren: boolean,
// ) => {
//   if (__DEV__) {
//     if (!isValidElementType(type)) {
//       console.error(
//         `ayoc: ${type} is not a valid jsx element.`, type
//       );
//     }

//     const element = jsxDEV(type, props, key);

//     // The result can be nullish if a mock or a custom function is used.
//     // TODO: Drop this when these are no longer allowed as the type argument.
//     if (element == null) {
//       return element;
//     }

//     // Skip key warning if the type isn't valid since our key validation logic
//     // doesn't expect a non-string/function type and can throw confusing errors.
//     // We don't want exception behavior to differ between dev and prod.
//     // (Rendering will throw with a helpful message and as soon as the type is
//     // fixed, the key warnings will appear.)

//     if (validType) {
//       const children = props.children;
//       if (children !== undefined) {
//         if (isStaticChildren) {
//           if (isArray(children)) {
//             for (let i = 0; i < children.length; i++) {
//               validateChildKeys(children[i], type);
//             }

//             if (Object.freeze) {
//               Object.freeze(children);
//             }
//           } else {
//             console.error(
//               'React.jsx: Static children should always be an array. ' +
//                 'You are likely explicitly calling React.jsxs or React.jsxDEV. ' +
//                 'Use the Babel transform instead.',
//             );
//           }
//         } else {
//           validateChildKeys(children, type);
//         }
//       }
//     }

//     if (warnAboutSpreadingKeyToJSX) {
//       if (hasOwnProperty.call(props, 'key')) {
//         console.error(
//           'React.jsx: Spreading a key to JSX is a deprecated pattern. ' +
//             'Explicitly pass a key after spreading props in your JSX call. ' +
//             'E.g. <%s {...props} key={key} />',
//           getComponentNameFromType(type) || 'ComponentName',
//         );
//       }
//     }

//     if (type === REACT_FRAGMENT_TYPE) {
//       validateFragmentProps(element);
//     } else {
//       validatePropTypes(element);
//     }

//     return element;
//   }
// }


const jsx = __DEV__ ? jsxDev : jsxProd;

export default jsx;
