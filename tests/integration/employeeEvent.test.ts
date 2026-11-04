import { integrationTest, assert, client } from "./helpers/context";

integrationTest("employeeEvent.getMine", async () => {
  const value = await client.employeeEvent.getMine();

  assert(Array.isArray(value), "expected an event array");
  for (const event of value) {
    assert(typeof event.code === "string", "expected string code");
    assert(Array.isArray(event.options), "expected options");
  }
});

integrationTest("employeeEvent.getPendingCount", async () => {
  const value = await client.employeeEvent.getPendingCount();

  assert(Number.isInteger(value) && value >= 0, "expected a non-negative count");
});

integrationTest("employeeEvent.getHistory", async () => {
  // The history is for the key owner's employees, so WARERA_EMPLOYEE_ID is not used here.
  const [employee] = await client.employee.getMyEmployees();
  assert(employee, "The API key's account has no employees. Hire one to test employeeEvent.getHistory.");
  const employeeId = employee._id;
  const value = await client.employeeEvent.getHistory({ employeeId });

  assert(Array.isArray(value), "expected an event array");
  for (const [index, event] of value.entries()) {
    assert(event.participants.includes(employeeId), "expected the employee among the participants");
    if (index > 0) assert(value[index - 1].createdAt >= event.createdAt, "expected newest first");
  }
});
