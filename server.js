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
  const filePath = path.join(__dirname, "test-data", "test.txt");
  const data = fs.readFileSync(filePath);

  res.json({
    filename: "test.txt",
    contentBase64: data.toString("base64")
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on http://localhost:${port}`));
