import React from 'react';
import { render } from 'ink';
import App from './app.js';

process.title = 'morning-view';

const { waitUntilExit } = render(React.createElement(App), {
  exitOnCtrlC: false,
});

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

await waitUntilExit();
