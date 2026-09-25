import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const HOST = process.env.HOST || "127.0.0.1";

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

function resolveFilePath(reqUrl) {
  const cleanUrl = reqUrl.split("?")[0];
  const relativePath = cleanUrl === "/" || cleanUrl === "" ? "index.html" : cleanUrl.replace(/^\/+/, "");
  const normalized = path.normalize(relativePath).replace(/^(\.\.[/\\])+/, "");
  return path.join(__dirname, normalized);
}

function serveStaticFile(filePath, res) {
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("404 Not Found: Usability Prototype Resource");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "no-cache, no-store, must-revalidate",
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

function handleRequest(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("405 Method Not Allowed");
    return;
  }
  const targetPath = resolveFilePath(req.url);
  serveStaticFile(targetPath, res);
}

const server = http.createServer(handleRequest);

server.listen(PORT, HOST, () => {
  console.log(`[Task Prototype Server] Serving on http://${HOST}:${PORT}/`);
  console.log("[Notice] Isolated observation harness — completely outside Next.js routes.");
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
