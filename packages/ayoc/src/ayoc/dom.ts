/*
 * @Author: Kyusho 
 * @Date: 2022-08-04 20:40:10 
 * @Last Modified by: Kyusho
 * @Last Modified time: 2022-08-16 00:45:42
 */

import { ComponentContext, ComponentMemoSet, useComponentNode, __DANGEROUS_CUR_COMPONENT_REF } from './component';
import { Fragment, JSXElement, RenderElement, TextElement } from './jsx';


export type VirtualDOMNode = {
  type: string | symbol;
  props: Record<string, any>;
  style: Record<string, any>;
  children: VirtualDOMNode[];
  ref: Element;
  where: string | null;
};

const resolveVirtualDOM = (
  offset: number,
  context: ComponentContext,
  parent: Element,
  jsx: JSXElement,
  cache: Readonly<Map<string, VirtualDOMNode>>,
  parentRenderCache: ComponentMemoSet,
  dynamicComponentCache: ComponentMemoSet,
  emitComponentVisible: (componentId: string) => void,
): VirtualDOMNode[] => {
  const where = jsx.where;
  const cached = where ? (cache.get(where) ?? null) : null;

  const res: VirtualDOMNode[] = [];

  if (typeof jsx.type === 'function') {
    if (jsx.type.name === 'lazyComponent' && /^async props => \{/.test(`${jsx.type}`)) {
      return res;
    }

    // 组件
    const { lifetime = 'inherit' } = jsx.props;

    const ownerRenderCache = (
      lifetime === 'inherit' ? context.renderCache
        : lifetime === 'dynamic' ? dynamicComponentCache
          : lifetime === 'static' ? context.root.renderCache
            : lifetime.renderCache
    );

    // console.log('ownerRenderCache', ownerRenderCache);
    if (where !== undefined) {
      const id = `<${jsx.type.name}/> at ${where};${
        jsx.key === null ? '' : `key ${typeof jsx.key === 'number' ? '=' : 'is'} ${jsx.key}`
      }`;

      emitComponentVisible(id);
    }
    
    const render = useComponentNode(
      context.root,
      ownerRenderCache,
      parentRenderCache,
      context,
      jsx.type,
      jsx.key ?? null,
      where ?? null,
    );
    
    render(parent, offset, jsx.props);
  } else if (typeof jsx.type === 'string') {
    // HTML 元素

    const tagName = jsx.type;
    const { style = {}, children, key: _, ref, ...props } = jsx.props;

    const useCached = Boolean(cached && cached.type === tagName);
    
    const element: VirtualDOMNode = {
      type: tagName,
      props,
      style,
      children: [],
      ref: useCached ? (() => {
        const which = cached!.ref;

        for (const child of which.childNodes) {
          child.remove();
        }

        return which;
      })() : document.createElement(tagName),
      where: where ?? null,
    };

    if (useCached) {
      for (const child of cached!.ref.childNodes) {
        cached!.ref.removeChild(child);
      }
    }

    res.push(element);

    const dom = element.ref;

    offsetMap.set(dom, offset);
    
    if (ref) {
      (ref as (element: Element) => void)(dom);
    }

    for (const key in (useCached ? cached!.props : {})) {
      if (Object.prototype.hasOwnProperty.call(cached!.props, key) && !Object.prototype.hasOwnProperty.call(props, key)) {
        if (/^on[A-Z]/.test(key)) {
          (dom as any)[key.toLowerCase()] = undefined;
        } else {
          dom.removeAttribute(key);
        }
      }
    }

    for (const key in props) {
      if (Object.prototype.hasOwnProperty.call(props, key)) {
        const prevVal = useCached ? cached!.props[key] : undefined;
        const nextVal = props[key];

        if (prevVal !== nextVal) {
          if (/^on[A-Z]/.test(key)) {
            (dom as any)[key.toLowerCase()] = nextVal;
          } else {
            dom.setAttribute(key, nextVal);
          }
        }
      }
    }

    for (const key in (useCached ? cached!.style : {})) {
      if (Object.prototype.hasOwnProperty.call(cached!.style, key) && !Object.prototype.hasOwnProperty.call(style, key)) {
        (dom as HTMLElement).style[key as Exclude<keyof CSSStyleDeclaration, 'length' | 'parentRule'>] = undefined as any;
      }
    }

    for (const key in style) {
      if (Object.prototype.hasOwnProperty.call(style, key) && key in (dom as HTMLElement).style) {
        const nextVal = style[key];
        (dom as HTMLElement).style[key as Exclude<keyof CSSStyleDeclaration, 'length' | 'parentRule'>] = nextVal;
      }
    }

    element.ref = dom;

    children.forEach((child, i) => {
      const node = resolveVirtualDOM(
        i,
        context,
        dom,
        child,
        cache,
        parentRenderCache,
        dynamicComponentCache,
        emitComponentVisible
      );

      node.forEach(e => {
        dom.appendChild(e.ref);
      });

      element.children.push(...node);
    });
  } else if (jsx.type === TextElement) {
    // 文字节点

    const useCached = Boolean(cached && cached.type === TextElement);

    const element: VirtualDOMNode = {
      type: TextElement,
      props: {},
      style: {},
      children: [],
      ref: useCached ? cached!.ref : document.createTextNode(jsx.props.nodeValue ?? '') as unknown as Element,
      where: where ?? null,
    };

    if (useCached) {
      element.ref.innerHTML = jsx.props.nodeValue ?? '';
    }

    offsetMap.set(element.ref, offset);

    res.push(element);
  } else if (jsx.type === Fragment) {
    // Fragment

    jsx.props.children.forEach(child => {
      res.push(
        ...resolveVirtualDOM(
          offset,
          context,
          parent,
          child,
          cache,
          parentRenderCache,
          dynamicComponentCache,
          emitComponentVisible
        ),
      );
    });
  }

  return res;
};

export const generateTree = (
  context: ComponentContext,
  parent: Element,
  offset: number,
  next: RenderElement,
  cache: Readonly<Map<string, VirtualDOMNode>>,
  parentRenderCache: ComponentMemoSet,
  dynamicComponentCache: ComponentMemoSet,
  emitComponentVisible: (componentId: string) => void,
): VirtualDOMNode[] => {
  const res: VirtualDOMNode[] = [];

  if (next) {
    res.push(
      ...resolveVirtualDOM(
        offset,
        context,
        parent,
        next,
        cache,
        parentRenderCache,
        dynamicComponentCache,
        emitComponentVisible
      )
    );
  }

  return res;
};

export const cacheNodes = (nodes: VirtualDOMNode[], cache: Map<string, VirtualDOMNode>): void => {
  for (const node of nodes) {
    if (node.where) {
      cache.set(node.where, node);

      if (node.children.length) {
        cacheNodes(node.children, cache);
      }
    }
  }
};

const offsetMap = new WeakMap<ChildNode, number>();

export const mountElements = (parent: Element, offset: number, elements: Element[]): void => {
  if (elements.length === 0) {
    return;
  }
  
  let nextNode: ChildNode | null = null;

  for (const child of [...parent.childNodes].reverse()) {
    const index = offsetMap.get(child) ?? 0;

    if (index > offset) {
      nextNode = child;
    } else {
      break;
    }
  }

  if (!nextNode) {
    elements.forEach(ele => {
      parent.appendChild(ele);
      offsetMap.set(ele, offset);
    });
  } else {
    elements.forEach(ele => {
      parent.insertBefore(ele, nextNode!);
      offsetMap.set(ele, offset);
    });
  }
};
