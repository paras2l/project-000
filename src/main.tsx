import React from 'react';
import ReactDOM from 'react-dom/client';
import NatsuVoiceApp from './ui/NatsuVoiceApp';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <NatsuVoiceApp />
  </React.StrictMode>
);
