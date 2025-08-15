import { Command } from 'commander';
import { helloCommand } from './commands/hello.js';

const program = new Command();

program
  .name('my-cli')
  .description('CLI tool with React Ink UI')
  .version('1.0.0');

program.addCommand(helloCommand);

if (process.argv.length === 2) {
  program.help();
}

program.parse();