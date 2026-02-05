const express = require("express");

const fileApp = require("./routes/dataapp");
const dataApp = require("./routes/filesapp");

const app = express();
app.use(express.json());

// mount routes
app.use("/", fileApp);
app.use("/", dataApp);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on http://localhost:${port}`));
