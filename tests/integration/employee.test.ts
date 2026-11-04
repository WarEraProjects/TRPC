import { integrationTest, assert, isObject, client, getEmployeeSample } from "./helpers/context";

integrationTest("employee.getMyEmployees", async () => {
  const value = await client.employee.getMyEmployees();

			assert(Array.isArray(value), "expected an employee array");
			for (const employee of value) {
				assert(typeof employee._id === "string", "expected string _id");
				assert(typeof employee.company === "string", "expected string company");
				assert(typeof employee.wage === "number", "expected numeric hourly wage");
				assert(typeof employee.estimate.production === "number", "expected numeric estimated production");
			}
});

integrationTest("employee.getMyWorkforceSummary", async () => {
  const value = await client.employee.getMyWorkforceSummary();

			assert(typeof value.employeeCount === "number", "expected numeric employeeCount");
			assert(typeof value.production === "number", "expected numeric production");
			assert(typeof value.wageCost === "number", "expected numeric wageCost");
			assert(isObject(value.productionByItem), "expected productionByItem object");
});

integrationTest("employee.getCompanyEmployees", async () => {
  const { companyId } = await getEmployeeSample();
  const value = await client.employee.getCompanyEmployees({ companyId });

			assert(value.length > 0, "expected the sample company's employees");
			for (const employee of value) {
				assert(employee.company === companyId, "expected only the requested company's employees");
			}
});

integrationTest("employee.getCompanyRoster", async () => {
  const { companyId } = await getEmployeeSample();
  const value = await client.employee.getCompanyRoster({ companyId });

			assert(Array.isArray(value.employees) && value.employees.length > 0, "expected employees");
			assert(isObject(value.hourly), "expected hourly totals");
			const production = value.employees.reduce((sum, employee) => sum + employee.estimate.production, 0);
			assert(Math.abs(production - value.hourly.production) < 0.05, "expected hourly production to sum the employees' estimates");
});

integrationTest("employee.getCompanyEstimate", async () => {
  const { companyId } = await getEmployeeSample();
  const value = await client.employee.getCompanyEstimate({ companyId });

			assert(typeof value.itemCode === "string", "expected string itemCode");
			assert(typeof value.production === "number", "expected numeric production");
			assert(typeof value.wageCost === "number", "expected numeric wageCost");
			assert(typeof value.cap === "number", "expected numeric cap");
});

integrationTest("employee.getManagerPointValue", async () => {
  const { companyId } = await getEmployeeSample();
  const value = await client.employee.getManagerPointValue({ companyId });

			assert(typeof value.productionPerPoint === "number", "expected numeric productionPerPoint");
});

integrationTest("employee.getById", async () => {
  const { employeeId } = await getEmployeeSample();
  const value = await client.employee.getById({ employeeId });

			assert(value?._id === employeeId, "expected the requested employee");
});

integrationTest("employee.getById unknown id", async () => {
  const value = await client.employee.getById({ employeeId: "000000000000000000000000" });

			assert(value === null, "expected null for an unknown employee");
});
