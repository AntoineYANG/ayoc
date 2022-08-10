import './index.css';
import {
  Component,
  useRenderRoot,
  useState,
  useCallback,
  useRef,
  useMemo,
  useEffect,
  useLayoutEffect,
} from 'ayoc';
import useRebuild from 'ayoc/hooks/use-rebuild';


const container = document.getElementById('root');

if (!container) {
  throw new Error(`container Node "#root" not found`);
}

const root = useRenderRoot(container);

const App: Component<{ d: number }> = ({ d }) => {
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
    console.log('更新了');
  });

  useEffect(() => {
    console.log('挂载了');

    return () => console.log('即将卸载');
  }, []);

  useEffect(() => {
    console.log('sum 改变了');
  }, [sum]);

  useLayoutEffect(() => {
    console.log('layout effect');
  });

  return (
    <div>
      <p>
        {`<ref> render count = ${renderCountRef.current}`}
      </p>
      <p>
        {`props d=${d}`}
      </p>
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
      >
        reset
      </button>
    </div>
  );
};

root(
  <p
    tabIndex={1}
    style={{
      border: '1px solid yellow',
      height: '2em',
    }}
  >
    <div>
      <App d={3456789} />
      abc
      <p>ddd</p>
    </div>
  </p>
);
