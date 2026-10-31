import express from "express";

const app = express();
const PORT = 4000;

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log("server running on Port:", PORT);
});
