import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import FlyingLogos from "./components/FlyingLogos";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    // <React.StrictMode>
    //
    //   <App />
    //   <FlyingLogos className="z-10"/>
    // </React.StrictMode>
    <>
        <FlyingLogos className="z-10"/>
        <App/>
    </>
);

