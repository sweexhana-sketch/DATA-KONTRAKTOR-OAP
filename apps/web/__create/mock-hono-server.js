export const serve = (options, callback) => {
    console.log('Vercel environment detected: @hono/node-server.serve() neutralized.');
    // Return a dummy server object to prevent crashes in calling code
    return {
        close: (cb) => cb?.(),
        unref: () => { },
        ref: () => { },
        address: () => ({ port: options.port || 3000, address: '127.0.0.1', family: 'IPv4' }),
        listen: () => { },
    };
};
