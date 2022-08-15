/*
 * @Author: Kyusho 
 * @Date: 2022-08-15 18:52:28 
 * @Last Modified by: Kyusho
 * @Last Modified time: 2022-08-16 00:45:01
 */

import type Component from '../component';
import { isJSXElement, JSXElement, RenderElement } from '../jsx';
import useRef from '../hooks/use-ref';
import useState from '../hooks/use-state';
import useLifetimeEffect from '../hooks/use-lifetime-effect';
import jsx from '../jsx';


export interface SuspenseProps {
  /** 加载状态和失败状态时展示的内容 */
  fallback?: RenderElement;
  /** 描述完成状态渲染内容的一个 Promise */
  children: [Promise<RenderElement> | LazyComponent<any>];
  /** 用于捕获 Promise 抛出的错误信息的方法 */
  onReject?: (reason: any) => void;
}

export type SuspenseType = Component<SuspenseProps>;

/**
 * 传入一个返回可渲染元素的 Promise 作为 children.
 * 
 * 当 Promise 未完成时，将会展示 fallback 的内容；
 * 当 Promise 成功后，会自动更新为应展示的内容；
 * 如果 Promise 失败，错误会被捕获并继续展示 fallback 的内容，可以定义 onReject 以获取错误信息.
 *
 * @param {SuspenseProps} props
 */
const Suspense: SuspenseType = ({
  fallback = null,
  children,
  onReject = (reason: any) => {
    console.error(
      new Error(
        '<Suspense> caught an error from the Promise.', {
          cause: reason,
        }
      )
    );
  },
}: SuspenseProps) => {
  const resolvedValueRef = useRef<RenderElement>(null);
  const [fulfilled, setFulfilled] = useState(false);
  const promiseRef = useRef<Promise<RenderElement> | null>(null);
  const onRejectRef = useRef(onReject);
  onRejectRef.current = onReject;
  const hangingRef = useRef(children[0]);

  const isSame = children[0] === hangingRef.current;

  if (!isSame) {
    hangingRef.current = children[0];
    resolvedValueRef.current = null;
  }
  
  useLifetimeEffect(() => {
    setFulfilled(false);

    if (isJSXElement(hangingRef.current)) {
      const lazyComponent = hangingRef.current as unknown as Omit<JSXElement, 'type'> & {
        type: (props: any) => Promise<RenderElement>;
      };

      const p = lazyComponent.type(lazyComponent.props).then(
        data => {
          if (p === promiseRef.current) {
            resolvedValueRef.current = data;
            setFulfilled(true);
          }
  
          return data;
        }
      ).catch(
        reason => {
          if (p === promiseRef.current) {
            onRejectRef.current(reason);
          }
  
          return null;
        }
      );
  
      promiseRef.current = p;
    } else {
      const promise = hangingRef.current as Promise<RenderElement>;

      const p = promise.then(
        data => {
          if (p === promiseRef.current) {
            resolvedValueRef.current = data;
            setFulfilled(true);
          }
  
          return data;
        }
      ).catch(
        reason => {
          if (p === promiseRef.current) {
            onRejectRef.current(reason);
          }
  
          return null;
        }
      );
  
      promiseRef.current = p;
    }


    return () => {
      promiseRef.current = null;
    };
  }, [hangingRef.current]);

  return isSame && fulfilled ? resolvedValueRef.current : fallback;
};

export type AsyncComponentLoader<P extends Record<string | number | symbol, any>> = Promise<Component<P>>;
export type LazyComponent<P extends Record<string | number | symbol, any>> = (
  props: Parameters<Component<P>>[0]
) => ReturnType<Component<P>>;

export const lazy = <P extends Record<string | number | symbol, any>>(
  loader: () => AsyncComponentLoader<P>
): LazyComponent<P> => {
  const ResolvedComponentPromise = loader();

  const lazyComponent = async (props: Readonly<P>) => {
    return jsx(await ResolvedComponentPromise, props);
  };

  return lazyComponent as unknown as LazyComponent<P>;
};


export default Suspense;
