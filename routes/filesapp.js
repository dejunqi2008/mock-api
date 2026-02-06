const crypto = require("crypto");
const express = require("express");
const fs = require("fs");
const multer = require("multer");
const path = require("path");

const router = express.Router();
const TEST_DATA_DIR = path.join(__dirname, "..", "test-data");

router.get("/", (req, res) => res.type("text/plain").send("ok\n"));

const UPLOAD_DIR = path.join(__dirname, "..", "test-data/uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR);
}

// Jira addAttachment: multipart/form-data, part name "file"
const multerUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
});

// POST /rest/api/2/issue/:issueIdOrKey/attachments (Jira connector addAttachment)
router.post(
  "/rest/api/2/issue/:issueIdOrKey/attachments",
  multerUpload.single("file"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "Missing file part (field name: file)" });
    }

    const { issueIdOrKey } = req.params;
    const buffer = req.file.buffer;
    const filename = req.file.originalname || req.file.fieldname;
    const mimeType = req.file.mimetype || "application/octet-stream";
    const size = buffer.length;

    const attachmentId = `mock-${crypto.randomUUID()}`;
    const baseUrl = `${req.protocol}://${req.get("host")}`;

    const attachment = {
      id: attachmentId,
      filename,
      size,
      mimeType,
      self: `${baseUrl}/rest/api/2/attachment/${attachmentId}`,
      author: {
        displayName: "Mock User",
        accountId: "mock-account-id",
      },
    };

    const filePath = path.join(UPLOAD_DIR, `${attachmentId}_${filename}`);
    await fs.promises.writeFile(filePath, buffer);

    // Jira returns an array; connector uses response.body[0]
    return res.status(200).json([attachment]);
  }
);

// GET /rest/api/2/attachment/content/:attachmentId (Jira connector getAttachmentContent)
router.get("/rest/api/2/attachment/content/:attachmentId", async (req, res) => {
  const { attachmentId } = req.params;
  try {
    const entries = await fs.promises.readdir(UPLOAD_DIR, { withFileTypes: true });
    const file = entries.find((e) => e.isFile() && e.name.startsWith(attachmentId));
    if (!file) {
      return res.status(404).json({ error: "Attachment not found" });
    }
    const filePath = path.join(UPLOAD_DIR, file.name);
    const filename = file.name.replace(/^[^_]+_/, "");
    res.set({
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": "application/octet-stream",
    });
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (err) {
    console.error("Get attachment error:", err);
    res.status(500).json({ error: err?.message || String(err) });
  }
});

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
