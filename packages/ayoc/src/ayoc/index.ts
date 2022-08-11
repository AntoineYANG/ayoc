/*
 * @Author: Kyusho 
 * @Date: 2022-08-03 16:31:44 
 * @Last Modified by: Kyusho
 * @Last Modified time: 2022-08-12 00:16:24
 */

import { useRenderRoot } from './root';
import type Component from './component';
import usePropsComparer from './hooks/use-props-comparer';
import useState from './hooks/use-state';
import useRebuild from './hooks/use-rebuild';
import useRef from './hooks/use-ref';
import useCallback from './hooks/use-callback';
import useMemo from './hooks/use-memo';
import useEffect from './hooks/use-effect';
import useLayoutEffect from './hooks/use-layout-effect';
import useLifetimeFlag from './hooks/use-lifetime-flag';
import type { LifetimeAnnotation, LifetimeFlag } from './lifetime';


// 定义转译 JSX 的方法
// @see https://fettblog.eu/jsx-syntactic-sugar/


export {
  useRenderRoot,
  Component,
  usePropsComparer,
  useState,
  useRebuild,
  useRef,
  useCallback,
  useMemo,
  useEffect,
  useLayoutEffect,
  useLifetimeFlag,
  LifetimeAnnotation,
  LifetimeFlag,
};
