import { useState } from 'react';
import logo from './logo.svg';
import './App.css';

function App() {
  const [binaryVal, setBinaryVal] = useState(0);
  const [decimalVal, setDecimalVal] = useState();
  const handleBinaryChange = e => {
    setBinaryVal(e.target.value)

  }
  const handleDecimal = () => {
    const bv = binaryVal.split('')

    const result = bv.reverse().reduce(function (x, y, i) {

      return (y === '1') ? x + Math.pow(2, i) : x;
    }, 0);
    setDecimalVal(`The value converted into decimal is ${result}`);
  }
  return (

    <div className="container">
      <div className="container_left">
        <span>Type what you want in binary:</span>
        <input type="text" value={binaryVal} onChange={(e) => handleBinaryChange(e)} />
        <button onClick={handleDecimal}>Convert</button>
        <h2>{decimalVal}</h2>
      </div>
      <div className="container_right">
      </div>
    </div>

  );
}

export default App;
