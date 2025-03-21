const request = require("supertest");
const { app } = require("../index"); // Import the Express app
const http = require("http");
jest.setTimeout(70000);
jest.mock("../index.js", () => ({
  ...jest.requireActual("../index.js"),
}));
let server;
beforeAll((done) => {
  server = http.createServer(app);
  server.listen(3001, done);
});

afterAll((done) => {
  server.close(done);
});

describe("User Authentication API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Correct Credentials Test", async () => {
    const mockUser = {
      email: "user@example.com",
      password: "securePassword123",
    };

    const response = await request(server).post("/login").send(mockUser);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("token");
  });

  test("Invalid Credentials Test", async () => {
    const mockUser = {
      email: "user@example.com",
      password: "wrongPassword",
    };
    const response = await request(server).post("/login").send(mockUser);

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty("error", "Invalid credentials");
  });

  test("Cooldown Period Test (Rate Limiting)", async () => {
    const mockInvalidUser = {
      email: "user@example.com",
      password: "wrongPassword",
    };

    
    for (let i = 0; i < 5; i++) {
      await request(server).post("/login").send(mockInvalidUser);
    }

    // 6th attempt should be blocked
    const blockedResponse = await request(server)
      .post("/login")
      .send(mockInvalidUser);
    expect(blockedResponse.statusCode).toBe(429);
    expect(blockedResponse.body).toHaveProperty(
      "error",
      "Too many login attempts. Try again later."
    );

    // Wait for 1 minute before retrying
    await new Promise((resolve) => setTimeout(resolve, 60000));

    const mockValidUser = {
      email: "user@example.com",
      password: "securePassword123",
    };

    // Now a valid login attempt should succeed
    const afterCooldownResponse = await request(server)
      .post("/login")
      .send(mockValidUser);
    expect(afterCooldownResponse.statusCode).toBe(200);
    expect(afterCooldownResponse.body).toHaveProperty("success", true);
  });
});
