const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();

// Absolute path to your test file
const FILE_PATH = path.join(__dirname, "test-data", "test.txt");

// Optional: map extension -> content-type (you can keep octet-stream if you want)
function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".txt":
      return "text/plain";
    case ".png":
      return "image/png";
    case ".pdf":
      return "application/pdf";
    default:
      return "application/octet-stream";
  }
}

app.get("/", (req, res) => res.type("text/plain").send("ok\n"));

app.get("/download", (req, res) => {
  const fs = require("fs");
  const path = require("path");

  const FILE_PATH = path.join(__dirname, "testdata", "test.txt");
  const data = fs.readFileSync(FILE_PATH);           // bytes
  const b64 = data.toString("base64");               // base64 string

  res.set("Content-Type", "text/plain");             // or application/json
  res.set("Content-Disposition", 'attachment; filename="test.txt"'); // optional
  res.set("Cache-Control", "no-store");

  return res.status(200).send(b64);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on http://localhost:${port}`));
