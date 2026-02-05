const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();
const TEST_DATA_DIR = path.join(__dirname, "..", "test-data");

router.get("/", (req, res) => res.type("text/plain").send("ok\n"));

router.get("/download", (req, res) => {
  const filePath = path.join(TEST_DATA_DIR, "test.txt");
  const data = fs.readFileSync(filePath);

  res.json({
    filename: "test.txt",
    contentBase64: data.toString("base64"),
  });
});

router.get("/enumSchema", (req, res) => {
  const filePath = path.join(TEST_DATA_DIR, "enum-persistence-test-v3.json");
  const data = fs.readFileSync(filePath, "utf-8");
  const jsonData = JSON.parse(data);

  res.set("Cache-Control", "public, max-age=300");
  return res.status(200).json(jsonData);
});

module.exports = router;
