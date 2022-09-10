import { createRequestHandler } from "@remix-run/express";
import compression from "compression";
import express, { type Request, type Response, type Express } from "express";
import fs from "fs";
import https from "https";
import morgan from "morgan";
import WebSocket from "ws";

type User = {
  id: string;
  name: string;
};

declare global {
  namespace Express {
    export interface Request {
      user?: User;
    }
  }
}
export function createApp(
  buildPath: string,
  mode = "production",
  publicPath = "/build/",
  assetsBuildDirectory = "public/build/"
) {
  let app = express();

  app.disable("x-powered-by");
  app.use(function (req, res, next) {
    res.setHeader("X-Powered-By", "TS Remix App Server");
    next();
  });
  app.use(compression());

  app.use(
    publicPath,
    express.static(assetsBuildDirectory, { immutable: true, maxAge: "1y" })
  );

  app.use(express.static("public", { maxAge: "1h" }));

  app.use(morgan("tiny"));

  // add custom loader context
  function getLoadContext(req: Request, _res: Response) {
    // this becomes the loader context
    return { expressUser: req.user };
  }

  app.all(
    "*",
    mode === "production"
      ? createRequestHandler({
          build: require(buildPath),
          mode,
          getLoadContext,
        })
      : (req, res, next) => {
          // require cache is purged in @remix-run/dev where the file watcher is
          purgeRequireCache(buildPath);
          let build = require(buildPath);
          return createRequestHandler({ build, mode, getLoadContext })(
            req,
            res,
            next
          );
        }
  );

  return app;
}
function purgeRequireCache(buildPath: string) {
  for (const key in require.cache) {
    if (key.startsWith(buildPath)) {
      console.log("purging", key);
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete require.cache[key];
    }
  }
}

export function createServer(app: Express, port: number) {
  const server = https
    .createServer(
      // Provide the private and public key to the server by reading each
      // file's content with the readFileSync() method.
      {
        key: fs.readFileSync("server.key"),
        cert: fs.readFileSync("server.crt"),
      },
      app
    )
    .listen(port, () => {
      console.log(`server is running at https://localhost:${port}`);
    });
  return server;
}

export function createSocketServer(port: number) {
  const server = https.createServer(
    // Provide the private and public key to the server by reading each
    // file's content with the readFileSync() method.
    {
      key: fs.readFileSync("server.key"),
      cert: fs.readFileSync("server.crt"),
    }
  );
  const wss = new WebSocket.Server({ server });

  server.listen(port, () => {
    console.log(`socket server is running at https://localhost:${port}`);
  });
  return wss;
}
