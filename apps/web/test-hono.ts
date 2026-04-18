import { Hono } from 'hono';

const myApp = new Hono();
myApp.get('/hello', (c) => c.text('Hello World!'));

const serverApp = new Hono(myApp as any);
console.log('Routes in serverApp:', serverApp.routes.length);
console.log('Routes in myApp:', myApp.routes.length);
