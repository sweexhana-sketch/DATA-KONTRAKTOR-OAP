import { app } from './index';
import { createRequestHandler } from 'react-router';
// @ts-ignore
import * as build from 'virtual:react-router/server-build';

const finalBuild = { ...build };
if (!finalBuild.future) {
    (finalBuild as any).future = { v8_middleware: true };
}
const handler = createRequestHandler(finalBuild as any);

app.all('*', (c) => handler(c.req.raw));

export default app;
export { app };
