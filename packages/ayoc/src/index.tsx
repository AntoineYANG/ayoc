import './index.css';
import {
  Component,
  useRenderRoot,
  usePropsComparer,
  useRebuild,
  useState,
  useCallback,
  useRef,
  useMemo,
  useEffect,
  useLayoutEffect,
  useLifetimeFlag,
  LifetimeFlag,
  useLifetimeEffect,
} from 'ayoc';


const container = document.getElementById('root');

if (!container) {
  throw new Error(`container Node "#root" not found`);
}

const root = useRenderRoot(container);

const Empty: Component<{ name: string }> = ({ name }) => {
  useLifetimeEffect(() => {
    console.log(`${name} 组件被创建`);

    return () => console.log(`${name} 组件被销毁`);
  }, [name]);

  useEffect(() => {
    console.log(`${name} 组件被挂载`);

    return () => console.log(`${name} 组件被卸载`);
  }, [name]);

  return null;
};

const App: Component<{ d: number, parentLifetime: LifetimeFlag }> = ({ d, parentLifetime }) => {
  usePropsComparer<{ d: number }>((prevProps, nextProps) => prevProps.d === nextProps.d);
  
  const [val, setVal] = useState(0, {
    shouldUpdate: 'pure',
  });
  const [val2, setVal2] = useState(10);
  const renderCountRef = useRef(0);

  renderCountRef.current += 1;

  const onClick = useCallback(() => {
    return () => setVal(val2 % 10);
  }, [val2]);

  const onClick2 = useCallback(() => {
    return () => setVal2.from(prevVal => prevVal + 1);
  }, []);

  const rebuild = useRebuild();

  const reset = useCallback(() => {
    return () => rebuild();
  }, [rebuild]);

  const sum = useMemo(() => val + val2, [val, val2]);

  useEffect(() => {
    console.log('父组件更新了');

    return () => console.log('父组件将更新');
  });
  
  useLifetimeEffect(() => {
    console.log('App: 创建');

    return () => {
      console.log('App: 销毁');
    };
  }, []);

  useEffect(() => {
    console.log('val1 改变了');
  }, [val]);

  const resetBtnRef = useRef<HTMLButtonElement | null>(null);

  useLayoutEffect(() => {
    console.log('父组件更新（layout effect）', resetBtnRef);
  });

  return (
    <div>
      <p>
        {`<ref> render count = ${renderCountRef.current}`}
      </p>
      <p>
        {`props d=${d}`}
      </p>
      <Empty name="inherit" />
      <Empty name="dynamic" lifetime="dynamic" />
      <Empty name="static" lifetime="static" />
      <Empty name="lifetime=parent" lifetime={parentLifetime} />
      <>
        <p>
          {`<useState> state a = ${val}`}
        </p>
        <button
          onClick={onClick}
        >
          a = b % 10
        </button>
        <p>
          {`<useState> state b = ${val2}`}
        </p>
        <button
          onClick={onClick2}
        >
          b += 1
        </button>
      </>
      <p>
        {`<useMemo> memoized (a + b) = ${sum}`}
      </p>
      <hr />
      <button
        onClick={reset}
        ref={e => {
          resetBtnRef.current = e;
        }}
      >
        reset
      </button>
    </div>
  );
};

const Wrapper: Component = () => {
  const [show, setShow] = useState(true);

  const toggle = useCallback(() => {
    return () => setShow.from(show => !show);
  }, []);

  const lifetimeFlag = useLifetimeFlag();

  return (
    <div>
      <button
        onClick={toggle}
      >
        toggle
      </button>
      <p>
        {`render <App /> : ${show}`}
      </p>
      {
        show && (
          <App d={3456789} parentLifetime={lifetimeFlag} />
        )
      }
    </div>
  );
};

root(
  <div
    tabIndex={1}
    style={{
      border: '1px solid yellow',
    }}
  >
    <div>
      <Wrapper />
    </div>
  </div>
);
