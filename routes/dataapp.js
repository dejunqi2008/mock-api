const express = require("express");
const router = express.Router();

// Enums from OpenAPI components/schemas
const STATUS_ENUM = new Set(["active", "inactive", "pending", "archived"]);
const PRIORITY_ENUM = new Set([1, 2, 3, 4, 5]);

function badRequest(res, message, details) {
  return res.status(400).json({
    error: "BadRequest",
    message,
    ...(details ? { details } : {}),
  });
}

/**
 * GET /test?status=active
 * GET /test?status=archived&priority=1
 */
router.get("/test", (req, res) => {
  const { status, priority } = req.query;
  console.log(status + ", " + priority);

  if (status == null || status === "") {
    return badRequest(res, "Missing required query parameter: status", {
      allowedStatus: Array.from(STATUS_ENUM),
    });
  }
  if (!STATUS_ENUM.has(String(status))) {
    return badRequest(res, "Invalid status value", {
      received: status,
      allowedStatus: Array.from(STATUS_ENUM),
    });
  }

  let parsedPriority = undefined;
  if (priority != null && priority !== "") {
    const n = Number(priority);
    if (!Number.isInteger(n)) {
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

  return res.status(200).json({
    id: Date.now(),
    status: String(status),
    ...(parsedPriority !== undefined ? { priority: parsedPriority } : {}),
    message: `OK: status=${status}${parsedPriority !== undefined ? `, priority=${parsedPriority}` : ""}`,
  });
});

/**
 * POST /addData
 * body: { "status": "active", "priority": 1 }
 */
router.post("/addData", (req, res) => {
  const { status, priority } = req.body || {};
  console.log("POST /addData body:", req.body);

  if (status == null || status === "") {
    return badRequest(res, "Missing required body field: status", {
      allowedStatus: Array.from(STATUS_ENUM),
      example: { status: "active", priority: 1 },
    });
  }
  if (!STATUS_ENUM.has(String(status))) {
    return badRequest(res, "Invalid status value", {
      received: status,
      allowedStatus: Array.from(STATUS_ENUM),
    });
  }

  let parsedPriority = undefined;
  if (priority != null && priority !== "") {
    const n = Number(priority);
    if (!Number.isInteger(n)) {
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

  return res.status(200).json({
    id: Date.now(),
    status: String(status),
    ...(parsedPriority !== undefined ? { priority: parsedPriority } : {}),
    message: `OK: status=${status}${parsedPriority !== undefined ? `, priority=${parsedPriority}` : ""}`,
  });
});

module.exports = router;
