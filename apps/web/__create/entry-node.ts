import { app } from './index';
import { createRequestHandler } from 'react-router';
// @ts-ignore
import * as build from 'virtual:react-router/server-build';

const handler = createRequestHandler(build as any);

app.all('*', (c) => handler(c.req.raw));

export default app;
export { app };
