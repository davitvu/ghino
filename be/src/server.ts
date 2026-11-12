import express from "express";
import { randomUUID } from "node:crypto";
import type { Customer } from "./customer.ts";
import { pool } from "./db.ts";

const app = express();
const PORT = 4000;

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/customers", async (req, res) => {
  const body: unknown = req.body;

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    res.status(400).json({ message: "Dữ liệu không hợp lệ" });
    return;
  }

  if (
    !("name" in body) ||
    typeof body.name !== "string" ||
    body.name.trim() === ""
  ) {
    res.status(400).json({ message: "Tên khách hàng không hợp lê" });
    return;
  }

  if (
    "phone" in body &&
    body.phone !== null &&
    typeof body.phone !== "string"
  ) {
    res.status(400).json({ message: "Số điện thoại phải là chuỗi hoặc null" });
    return;
  }

  const name: string = body.name.trim();
  let phone: string | null = null;

  if ("phone" in body && typeof body.phone === "string") {
    let temp = body.phone.trim();
    if (temp) {
      phone = temp;
    }
  }

  const newCustomer: Customer = {
    id: randomUUID(),
    name: name,
    phone: phone,
  };

  await pool.query(
    "INSERT INTO customers (id, name, phone) VALUES ($1, $2, $3)",
    [newCustomer.id, newCustomer.name, newCustomer.phone],
  );

  res.status(201).json({ message: "Thành công", data: newCustomer });
});

app.get("/customers", async (req, res) => {
  const result = await pool.query("SELECT id, name, phone FROM customers");

  res.status(200).json({ data: result.rows });
});

app.get("/customers/:id", async (req, res) => {
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(req.params.id)) {
    res.status(400).json({ message: "ID khách hàng không hợp lệ" });
    return;
  }

  const result = await pool.query(
    "SELECT id, name, phone FROM customers WHERE id=$1",
    [req.params.id],
  );

  if (result.rowCount === 0) {
    res.status(404).json({ message: "Không tìm thấy khách hàng!" });
    return;
  }

  res.status(200).json({ data: result.rows[0] });
});

app.post("/customers/:id/transactions", async (req, res) => {
  const customerId = req.params.id;
  const body: unknown = req.body;

  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(customerId)) {
    res.status(400).json({ message: "ID khách hàng không hợp lệ" });
    return;
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    res.status(400).json({ message: "Dữ liệu không hợp lệ" });
    return;
  }

  if (!("type" in body) || (body.type !== "payment" && body.type !== "debt")) {
    res.status(400).json({ message: "Loại giao dịch không hợp lệ" });
    return;
  }

  if (
    !("amount" in body) ||
    typeof body.amount !== "number" ||
    !Number.isSafeInteger(body.amount) ||
    body.amount <= 0
  ) {
    res.status(400).json({ message: "Số tiền phải là số nguyên dương" });
    return;
  }

  const result = await pool.query("SELECT id FROM customers WHERE id = $1", [
    customerId,
  ]);
  if (result.rowCount === 0) {
    res.status(404).json({ message: "Không tìm thấy khách hàng" });
    return;
  }

  const inserted = await pool.query(
    "INSERT INTO transactions (id, customer_id, type, amount) VALUES ($1, $2, $3, $4) RETURNING id, customer_id, type, amount",
    [randomUUID(), customerId, body.type, body.amount],
  );

  res.status(201).json({ data: inserted.rows[0] });
});

app.get("/customers/:id/balance", async (req, res) => {
  const customerId = req.params.id;

  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(customerId)) {
    res.status(400).json({ message: "ID khách hàng không hợp lệ" });
    return;
  }

  const result = await pool.query("SELECT id FROM customers WHERE id = $1", [
    customerId,
  ]);

  if (result.rowCount === 0) {
    res.status(404).json({ message: "Không tìm thấy khách hàng" });
    return;
  }

  const balanceResult = await pool.query(
    `SELECT COALESCE(
     SUM(CASE type
       WHEN 'debt' THEN amount
       WHEN 'payment' THEN -amount
     END),
     0
   ) AS balance
   FROM transactions
   WHERE customer_id = $1`,
    [customerId],
  );

  res.status(200).json({ data: balanceResult.rows[0] });
});

app.listen(PORT, () => {
  console.log("server running on Port:", PORT);
});
