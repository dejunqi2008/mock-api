const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

// Absolute path to your test file
const FILE_PATH = path.join(__dirname, "test-data", "test.txt");

// Enums from OpenAPI components/schemas
const STATUS_ENUM = new Set(["active", "inactive", "pending", "archived"]);
const PRIORITY_ENUM = new Set([1, 2, 3, 4, 5]);


app.get("/", (req, res) => res.type("text/plain").send("ok\n"));

app.get("/download", (req, res) => {
  const filePath = path.join(__dirname, "test-data", "test.txt");
  const data = fs.readFileSync(filePath);

  res.json({
    filename: "test.txt",
    contentBase64: data.toString("base64")
  });
});

app.get("/enumSchema", (req, res) => {
  const filePath = path.join(__dirname, "test-data", "enum-persistence-test-v3.json");
  const data = fs.readFileSync(filePath, "utf-8");
  const jsonData = JSON.parse(data);
  res.set("Cache-Control", "public, max-age=300"); 
  return res.status(200).json(jsonData);
})




function badRequest(res, message, details) {
  return res.status(400).json({
    error: "BadRequest",
    message,
    ...(details ? { details } : {}),
  });
}



/**
GET /test?status=active
GET /test?status=archived&priority=1
 */
app.get("/test", (req, res) => {
  const { status, priority } = req.query;
  
  console.log(status + ', ' + priority)

  // status is required
  if (status == null || status === "") {
    return badRequest(res, "Missing required query parameter: status", {
      allowedStatus: Array.from(STATUS_ENUM),
    });
  }

  // status must be one of the enum values
  if (!STATUS_ENUM.has(String(status))) {
    return badRequest(res, "Invalid status value", {
      received: status,
      allowedStatus: Array.from(STATUS_ENUM),
    });
  }

  // priority is optional, but if present must be integer enum [1..5]
  let parsedPriority = undefined;
  if (priority != null && priority !== "") {
    // Express query params are strings; convert to integer
    const n = Number(priority);
    const isInt = Number.isInteger(n);

    if (!isInt) {
      return badRequest(res, "Invalid priority value (must be an integer)", {
        received: priority,
        allowedPriority: Array.from(PRIORITY_ENUM),
      });
    }
    if (!PRIORITY_ENUM.has(n)) {
      return badRequest(res, "Invalid priority value (out of allowed enum)", {
        received: n,
        allowedPriority: Array.from(PRIORITY_ENUM),
      });
    }
    parsedPriority = n;
  }

  /**
   * 
   * PSOT /addData
   * body: {
   *     "status": "active",
   *     "priority": 1
   * }
   */
  app.post("/addData", (req, res) => {
    const { status, priority } = req.body || {};
    console.log("POST /addData body:", req.body);

        // status is required
    if (status == null || status === "") {
      return badRequest(res, "Missing required body field: status", {
        allowedStatus: Array.from(STATUS_ENUM),
        example: { status: "active", priority: 1 },
      });
    }

    // status must be one of the enum values
    if (!STATUS_ENUM.has(String(status))) {
      return badRequest(res, "Invalid status value", {
        received: status,
        allowedStatus: Array.from(STATUS_ENUM),
      });
    }

    // priority is optional, but if present must be integer enum [1..5]
    let parsedPriority = undefined;
    if (priority != null && priority !== "") {
      const n = Number(priority);
      const isInt = Number.isInteger(n);

      if (!isInt) {
        return badRequest(res, "Invalid priority value (must be an integer)", {
          received: priority,
          allowedPriority: Array.from(PRIORITY_ENUM),
        });
      }
      if (!PRIORITY_ENUM.has(n)) {
        return badRequest(res, "Invalid priority value (out of allowed enum)", {
          received: n,
          allowedPriority: Array.from(PRIORITY_ENUM),
        });
      }
      parsedPriority = n;
    }

    const responseBody = {
      id: Date.now(),
      status: String(status),
      ...(parsedPriority !== undefined ? { priority: parsedPriority } : {}),
      message: `OK: status=${status}${
        parsedPriority !== undefined ? `, priority=${parsedPriority}` : ""
      }`,
    };

    return res.status(200).json(responseBody);

  })

  // Build TestResponse (required: id, status; optional: priority, message)
  const responseBody = {
    id: Date.now(), // int64-ish
    status: String(status),
    ...(parsedPriority !== undefined ? { priority: parsedPriority } : {}),
    message: `OK: status=${status}${
      parsedPriority !== undefined ? `, priority=${parsedPriority}` : ""
    }`,
  };

  return res.status(200).json(responseBody);
});


const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on http://localhost:${port}`));
