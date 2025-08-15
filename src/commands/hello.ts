import { Command } from 'commander';
import { render } from 'ink';
import React from 'react';
import { HelloWorld } from '../components/HelloWorld.js';

export const helloCommand = new Command('hello')
  .description('Display a hello message')
  .option('-n, --name <name>', 'Name to greet', 'World')
  .action((options) => {
    render(React.createElement(HelloWorld, { name: options.name }));
  });