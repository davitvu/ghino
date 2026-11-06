import express from "express";
import { randomUUID } from "node:crypto";
import { customers, type Customer } from "./customer.ts";

const app = express();
const PORT = 4000;

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/customers", (req, res) => {
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

  customers.push(newCustomer);

  res.status(201).json({ message: "Thành công", data: newCustomer });
});

app.get("/customers", (req, res) => {
  res.status(200).json({ data: customers });
});

app.get("/customers/:id", (req, res) => {
  const customer = customers.find((item) => item.id === req.params.id);

  if (!customer) {
    res.status(404).json({ message: "Không tìm thấy khách hàng!" });
    return;
  }

  res.status(200).json({ data: customer });
});

app.listen(PORT, () => {
  console.log("server running on Port:", PORT);
});
