import { integrationTest, assert, client, getEmployeeSample } from "./helpers/context";

integrationTest("manager.getByCompanyId", async () => {
  const { companyId } = await getEmployeeSample();
  const value = await client.manager.getByCompanyId({ companyId });

			assert(value === null || value.company === companyId, "expected null or the company's manager");
});
