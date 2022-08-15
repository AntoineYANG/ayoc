/*
 * @Author: Kyusho 
 * @Date: 2022-08-03 16:31:44 
 * @Last Modified by: Kyusho
 * @Last Modified time: 2022-08-15 19:30:33
 */

// core
import type Component from './component';
import { useRenderRoot } from './root';
import type { LifetimeAnnotation, LifetimeFlag } from './lifetime';
// built-in components
import Fragment from './built-in/fragment';
import Suspense, { lazy } from './built-in/suspense';
// hooks
import useCallback from './hooks/use-callback';
import useEffect from './hooks/use-effect';
import useId from './hooks/use-id';
import useLayoutEffect from './hooks/use-layout-effect';
import useLifetimeEffect from './hooks/use-lifetime-effect';
import useLifetimeFlag from './hooks/use-lifetime-flag';
import useMemo from './hooks/use-memo';
import usePropsComparer from './hooks/use-props-comparer';
import useRebuild from './hooks/use-rebuild';
import useRef from './hooks/use-ref';
import useState from './hooks/use-state';


// 定义转译 JSX 的方法
// @see https://fettblog.eu/jsx-syntactic-sugar/


export {
  // core
  useRenderRoot,
  Component,
  LifetimeAnnotation,
  LifetimeFlag,
  // in-built components
  Fragment,
  Suspense,
  lazy,
  // hooks
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useLifetimeEffect,
  useLifetimeFlag,
  useMemo,
  usePropsComparer,
  useRebuild,
  useRef,
  useState,
};
