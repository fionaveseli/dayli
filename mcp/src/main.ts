import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadConfig, type Config } from './config';
import { ToolError } from './core/errors';
import { createServer } from './server';

async function main() {
  let config: Config;
  try {
    config = loadConfig(process.env);
  } catch (err) {
    const why = err instanceof ToolError ? `${err.message} ${err.hint ?? ''}` : String(err);
    console.error(`dayli-mcp: bad settings. ${why}`);
    process.exit(1);
  }
  await createServer(config).connect(new StdioServerTransport());
  // stdout carries the protocol; anything for humans goes to stderr.
  console.error(`dayli-mcp running on stdio (${config.source.name}, ${config.clock.timeZone})`);
}

main().catch((err) => {
  console.error('dayli-mcp failed to start:', err);
  process.exit(1);
});
