import './index.css';
import { Component, useRenderRoot, useState } from 'ayoc';


const container = document.getElementById('root');

if (!container) {
  throw new Error(`container Node "#root" not found`);
}

const root = useRenderRoot(container);
let e = 0;
const App: Component<{ d: number }> = ({ d }) => {
  const [val, setVal] = useState(0);

  const onClick = () => {
    setVal(val + 1);
  };

  return (
    <div>
      {`props.d=${d}`}
      <p>
        {`val=${val}`}
      </p>
      <button
        onClick={onClick}
      >
        add 1
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
