/*
 * @Author: Kyusho 
 * @Date: 2022-08-16 00:06:35 
 * @Last Modified by: Kyusho
 * @Last Modified time: 2022-08-16 00:08:30
 */

import type { Component } from 'ayoc';


const Box: Component<{ d: string }> = ({ d }) => {
  return (
    <div
      style={{
        margin: '0.4em',
        border: '1px solid blue',
        padding: '0.6em',
      }}
    >
      {d}
    </div>
  );
};

export default Box;
