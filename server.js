const express = require("express");

const dataApp = require("./routes/dataapp");
const fileApp = require("./routes/filesapp");
const referenceFileApp = require("./routes/referencefilesapp");

const app = express();

// Mount reference file routes FIRST so binary POST isn't parsed as JSON (avoids 400 from express.json())
app.use("/", referenceFileApp);

app.use(express.json());

app.use("/", dataApp);
app.use("/", fileApp);


const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on http://localhost:${port}`));
