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
  // Read file as bytes
  fs.readFile(FILE_PATH, (err, data) => {
    if (err) {
      console.error("Failed to read file:", err);
      return res.status(500).type("text/plain").send("Failed to read test file\n");
    }

    const filename = path.basename(FILE_PATH);

    // Send as "binary download"
    res.status(200);
    res.set("Content-Type", "application/octet-stream"); // keep it generic for your repro
    // If you want Salesforce/clients to get the filename (and extension), include this:
    res.set("Content-Disposition", `attachment; filename="${filename}"`);
    res.set("Content-Length", String(data.length));
    res.set("Cache-Control", "no-store");

    return res.send(data);
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on http://localhost:${port}`));
