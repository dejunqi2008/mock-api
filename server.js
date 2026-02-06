const express = require("express");

const dataApp = require("./routes/dataapp");
const fileApp = require("./routes/filesapp");
const referenceFileApp = require("./routes/referencefilesapp");

const app = express();
app.use(express.json());

// mount routes
app.use("/", dataApp);
app.use("/", fileApp);
app.use("/", referenceFileApp);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on http://localhost:${port}`));
