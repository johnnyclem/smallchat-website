import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, "dist", "public");
const port = process.env.PORT || 3000;

const app = express();

app.use(
  "/docs",
  express.static(path.join(distDir, "docs"), {
    extensions: ["html"],
    index: ["index.html"],
  })
);

app.use(express.static(distDir));

app.use((req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Serving on port ${port}`);
});
