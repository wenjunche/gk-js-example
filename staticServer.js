const http = require("http"),
  https = require("https"),
  url = require("url"),
  path = require("path"),
  fs = require("fs"),
  port = process.argv[2] || 8888,
  mimeTypes = {
    html: "text/html",
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
    png: "image/png",
    js: "text/javascript",
    css: "text/css",
    pac: "application/x-ns-proxy-autoconfig",
    pac2: "application/x-pac"
  };

function serviceReq(request, response) {
  if (request.method === "GET") {
      let uri = url.parse(request.url).pathname,
        filename = path.join(process.cwd(), uri);

      fs.exists(filename, function(exists) {
        if (!exists) {
          response.writeHead(404, { "Content-Type": "text/plain" });
          response.write("404 Not Found\n");
          response.end();
          console.log("404 " + request.url);
          return;
        }

        if (fs.statSync(filename).isDirectory()) {
          filename += "/index.html";
        }

        fs.readFile(filename, "binary", function(err, file) {
          if (err) {
            response.writeHead(500, { "Content-Type": "text/plain" });
            response.write(err + "\n");
            response.end();
            console.log("500 " + request.url);
            return;
          }

          let mimeType = mimeTypes[filename.split(".").pop()];

          if (!mimeType) {
            mimeType = "text/plain";
          }
          let headers = { "Content-Type": mimeType };

          response.writeHead(200, headers);
          response.write(file, "binary");
          console.log("200 " + mimeType + " " + request.url);
          response.end();
        });
      });
    }
  }

http
  .createServer(serviceReq)
  .listen(parseInt(port, 10));

const key  = fs.readFileSync('bigw.key', 'ascii');
const cert = fs.readFileSync('bigw.cert', 'ascii');
https
  .createServer({key: key, cert: cert}, serviceReq)
  .listen(parseInt(port, 10) + 1);

console.log(
  "Static file server running at\n  => http://localhost:" +
    port);
