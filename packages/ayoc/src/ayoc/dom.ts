/*
 * @Author: Kyusho 
 * @Date: 2022-08-04 20:40:10 
 * @Last Modified by: Kyusho
 * @Last Modified time: 2022-08-05 01:09:08
 */

import { ComponentContext, useComponentNode } from './component';
import { Fragment, JSXElement, RenderElement, TextElement } from './jsx';


export type VirtualDOMNode = {
  type: string | symbol;
  props: Record<string, any>;
  style: Record<string, any>;
  children: VirtualDOMNode[];
  ref: Element;
};

// export const resolveJSX = (
//   owner: ComponentContext,
//   slot: Element,
//   jsx: JSXElement,
// ): VirtualDOMNode[] => {
//   if (typeof jsx.type === 'function') {
//     const key = jsx.props['key'] ?? null;

//     if (key !== null) {
//       const which = owner.componentRefs.marked.get(key);

//       console.log({which});
//     } else {

//     }
//     // const render = useComponentRenderer(owner, jsx.type);
//     // render(slot, jsx.props);
//     console.log('child', jsx.type.name, owner);

//     return [];
//   } else if (jsx.type === TextElement) {
//     return [{
//       type: jsx.type,
//       props: {},
//       style: {},
//       children: [],
//     }];
//   } else if (jsx.type === Fragment) {
//     return jsx.props.children.reduce<VirtualDOMNode[]>((list, child) => {
//       const node = resolveJSX(owner, slot, child);
      
//       return [...list, ...node];
//     }, []);
//   }

//   const { style = {}, children, key: _, ...props } = jsx.props;
  
//   const element: VirtualDOMNode = {
//     type: jsx.type as string,
//     props,
//     style,
//     children: [],
//   };

//   children.forEach(child => {
//     const node = resolveJSX(owner, slot, child);

//     element.children.push(...node);
//   });

//   return [element];
// };

const resolveVirtualDOM = (context: ComponentContext, parent: Element, jsx: JSXElement): VirtualDOMNode[] => {
  const res: VirtualDOMNode[] = [];

  if (typeof jsx.type === 'function') {
    // 组件

    const render = useComponentNode(
      context,
      jsx.type,
      jsx.key ?? null,
    );
    
    render(parent, jsx.props);
  } else if (typeof jsx.type === 'string') {
    // HTML 元素

    const tagName = jsx.type;
    const { style = {}, children, key: _, ...props } = jsx.props;
    
    const element: VirtualDOMNode = {
      type: tagName,
      props,
      style,
      children: [],
      ref: document.createElement(tagName),
    };

    res.push(element);

    const dom = element.ref;

    for (const key in props) {
      if (Object.prototype.hasOwnProperty.call(props, key)) {
        const nextVal = props[key];

        if (/^on[A-Z]/.test(key)) {
          (dom as any)[key.toLowerCase()] = nextVal;
        } else {
          dom.setAttribute(key, nextVal);
        }
      }
    }

    for (const key in style) {
      if (Object.prototype.hasOwnProperty.call(style, key) && key in (dom as HTMLElement).style) {
        const nextVal = style[key];
        (dom as HTMLElement).style[key as Exclude<keyof CSSStyleDeclaration, 'length' | 'parentRule'>] = nextVal;
      }
    }

    element.ref = dom;

    children.forEach(child => {
      const node = resolveVirtualDOM(context, dom, child);

      node.forEach(e => {
        dom.appendChild(e.ref);
      });

      element.children.push(...node);
    });
  } else if (jsx.type === TextElement) {
    // 文字节点

    const element: VirtualDOMNode = {
      type: TextElement,
      props: {},
      style: {},
      children: [],
      ref: document.createTextNode(jsx.props.nodeValue ?? '') as unknown as Element,
    };

    res.push(element);
  }

  return res;
};

export const compareTree = (
  context: ComponentContext,
  parent: Element,
  prev: RenderElement,
  next: RenderElement,
): VirtualDOMNode[] => {
  const res: VirtualDOMNode[] = [];

  if (prev) {
    // FIXME:
  }

  if (next) {
    res.push(...resolveVirtualDOM(context, parent, next));
  }

  return res;
};
