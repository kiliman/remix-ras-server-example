# Sample site using custom _server.ts_ file for Remix App Server

This is based on [PR #4123](https://github.com/remix-run/remix/pull/4123).

Specify the server file in _remix.config.js_ as `serverEntryFile`.

Create a custom _server.ts_ that exports three functions:

- createApp
- createServer (create HTTPS server)
- createSocketServer (create WSS Socket Server)

I've also added a script to generate a public/private key pair for SSL.

```bash
./makecert
```

I've included files for `localhost`. You will need to add it to your trusted certs.

Run the app and you will see that it launches the server at https://localhost:3000
and the socket server at wss://localhost:8002

Since this is a custom Express server, you can do anything you would do with the
Express adapter, like adding middleware, accessing `getLoadContext`, etc. But you
get the nice DX of simply running `remix dev` and not a separate Express process.
