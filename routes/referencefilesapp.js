/**
 * Mock REST API for reference-connector file operations (interpreted-connectivity-link-weave).
 *
 * Schema from: interpreted-connectivity-link-weave/reference-connector/connectivity-model/.../Module.dwl
 *
 * - POST /rest/api/3/item/:resourceId/attachments — request body is raw Binary (not multipart).
 *   Response: Types.Attachment { id, filename, size, content, mimeType, self }
 * - GET  /rest/api/3/attachment/content/:id — returns raw binary with Content-Disposition.
 */

const crypto = require("crypto");
const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, "..", "test-data", "uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Reference connector addAttachment: raw binary body (no multipart)
 * Upload a file (raw binary body)
  curl -X POST http://localhost:3000/rest/api/3/item/TEST-123/attachments \
  -H "Content-Type: application/octet-stream" \
  --data-binary @/path/to/your/file.pdf
 * 
 */
router.post(
  "/rest/api/3/item/:resourceId/attachments",
  express.raw({ type: "*/*", limit: "200mb" }),
  async (req, res) => {
    const buf = req.body;

    console.log('[referencefilesapp] received request: POST /rest/api/3/item/.../attachments', {
      url: req.url,
      method: req.method,
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length'],
      bodyIsBuffer: Buffer.isBuffer(req.body),
      bodyType: typeof req.body,
      bodyLength: req.body?.length ?? (typeof req.body === 'string' ? req.body.length : 'n/a'),
    });

    if (!Buffer.isBuffer(buf)) {
      console.log('[referencefilesapp] 400: body is not raw binary', { bodyType: typeof buf });
      return res.status(400).json({ error: "Request body must be raw binary" });
    }

    const size = buf.length;
    const { resourceId } = req.params;
    const contentType = req.headers["content-type"] || "application/octet-stream";

    const attachmentId = `ref-${crypto.randomUUID().slice(0, 8)}`; // or e.g. `ref-${crypto.randomUUID().slice(0, 8)}`
    const filename = `ramdom.bin`; // reference mock uses picture.jpg; could derive from header if present
    const baseUrl = `${req.protocol}://${req.get("host")}`;

    const filePath = path.join(UPLOAD_DIR, `${attachmentId}_${filename}`);
    await fs.promises.writeFile(filePath, buf);

    const attachment = {
      id: attachmentId,
      filename,
      size,
      mimeType: contentType,
      content: `${baseUrl}/rest/api/3/attachment/content/${attachmentId}`,
      self: `${baseUrl}/rest/api/3/attachments/${attachmentId}`,
    };

    return res.status(200).json(attachment);
  }
);

// Reference connector getAttachmentContent: returns Binary with Content-Disposition
router.get("/rest/api/3/attachment/content/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const entries = await fs.promises.readdir(UPLOAD_DIR, { withFileTypes: true });
    const file = entries.find((e) => e.isFile() && e.name.startsWith(id));
    if (!file) {
      // Fallback: return fixed binary like Module.dwl mock ("binary-content-picture")
      res.set({
        "Content-Disposition": "attachment; filename*=UTF-8''picture.jpg",
        "Content-Type": "application/octet-stream",
      });
      return res.status(200).send(Buffer.from("binary-content-picture", "utf-8"));
    }
    const filePath = path.join(UPLOAD_DIR, file.name);
    const filename = file.name.replace(/^[^_]+_/, "");
    res.set({
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Content-Type": "application/octet-stream",
    });
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (err) {
    console.error("Get attachment content error:", err);
    res.status(500).json({ error: err?.message || String(err) });
  }
});

// List uploads (reference connector) — optional helper
// curl -X GET http://localhost:3000/rest/api/3/uploads
router.get("/rest/api/3/uploads", async (req, res) => {
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
            name: parsed.name,
            extension: parsed.ext ? parsed.ext.slice(1) : "",
            filename: e.name,
            size: stat.size,
          };
        })
    );
    files.sort((a, b) => b.size - a.size);
    res.status(200).json({ count: files.length, files });
  } catch (err) {
    console.error("List uploads error:", err);
    res.status(500).json({ error: err?.message || String(err) });
  }
});

// DELETE /rest/api/3/uploads - delete all files in the reference connector uploads folder (same API as Jira)
// curl -X DELETE http://localhost:3000/rest/api/3/uploads
router.delete("/rest/api/3/uploads", async (req, res) => {
  try {
    const entries = await fs.promises.readdir(UPLOAD_DIR, { withFileTypes: true });
    const files = entries.filter((e) => e.isFile());
    await Promise.all(files.map((e) => fs.promises.unlink(path.join(UPLOAD_DIR, e.name))));
    res.status(200).json({ deleted: files.length });
  } catch (err) {
    console.error("Delete uploads error:", err);
    res.status(500).json({ error: err?.message || String(err) });
  }
});

module.exports = router;
