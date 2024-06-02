import app from "@/configs/app";
import { expect, test } from "bun:test";

test("has port", () => {
  expect(app).toHaveProperty("port");
});
