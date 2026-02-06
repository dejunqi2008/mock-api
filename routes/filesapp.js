const express = require("express");
const fs = require("fs");
const path = require("path");


const router = express.Router();
const TEST_DATA_DIR = path.join(__dirname, "..", "test-data");

router.get("/", (req, res) => res.type("text/plain").send("ok\n"));


const UPLOAD_DIR = path.join(__dirname, "..", "test-data/uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR);
}


router.post('/rest/api/3/item/TEST-123/attachments', express.raw({type: '*/*', limit: '200mb'}), async (req, res) => {
    const buf = req.body; // Buffer
    console.log(req.headers);

    const size = Buffer.isBuffer(buf) ? buf.length : 0;

    console.log("content-type:", req.headers["content-type"]);
    console.log("content-length:", req.headers["content-length"]);
    console.log("bytes received:", size);

    const filename = `attachment_${crypto.randomUUID()}`;
    const filePath = path.join(UPLOAD_DIR, filename);
    await fs.promises.writeFile(filePath, buf);

    return res.status(200).json({
      content: "https://api.example.com/rest/api/3/attachment/content/10001",
      filename,
      id: "addAttachmentTest",
      mimeType: req.headers["content-type"] || "application/octet-stream",
      self: "https://api.example.com/rest/api/3/attachments/10001",
      size,
    });
})

router.get("/files", async (req, res) => {
  try {
    const entries = await fs.promises.readdir(UPLOAD_DIR, { withFileTypes: true });

    const files = await Promise.all(
      entries
        .filter((e) => e.isFile())
        .map(async (e) => {
          const filePath = path.join(UPLOAD_DIR, e.name);
          const stat = await fs.promises.stat(filePath);
          const parsed = path.parse(e.name);

          return {
            name: parsed.name,                    // filename without extension
            extension: parsed.ext.replace(".", ""),// extension without dot ("" if none)
            filename: e.name,                     // full filename
            size: stat.size,                      // bytes
          };
        })
    );

    // optional: sort newest first
    files.sort((a, b) => b.size - a.size);

    res.status(200).json({ count: files.length, files });
  } catch (err) {
    console.error("List files error:", err);
    res.status(500).json({ error: err?.message || String(err) });
  }
});


router.get("/enumSchema", (req, res) => {
  const filePath = path.join(TEST_DATA_DIR, "enum-persistence-test-v3.json");
  const data = fs.readFileSync(filePath, "utf-8");
  const jsonData = JSON.parse(data);

  res.set("Cache-Control", "public, max-age=300");
  return res.status(200).json(jsonData);
});

module.exports = router;
