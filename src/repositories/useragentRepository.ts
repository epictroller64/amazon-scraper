import { execute } from "../utils/mysql";
import { UseragentReport } from "../models/useragent";

export async function insertUseragentReport(
  report: UseragentReport,
): Promise<void> {
  const sql =
    "INSERT INTO useragentreports (useragent, status, site) VALUES (?,?,?)";
  return await execute(sql, [report.useragent, report.status, report.site]);
}
