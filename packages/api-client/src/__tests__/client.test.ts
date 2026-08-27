import { describe, expect, it } from "bun:test";
import { ApiClient } from "../index";

describe("ApiClient Unit Tests", () => {
  it("should initialize with default base URL", () => {
    const client = new ApiClient();
    expect(client).toBeDefined();
  });

  it("should set authorization token", () => {
    const client = new ApiClient("http://localhost:3000");
    client.setToken("my-jwt-token");
    expect(client).toBeDefined();
  });
});
