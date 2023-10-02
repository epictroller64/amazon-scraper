import { RowDataPacket } from "mysql2";

export default interface Cache extends RowDataPacket {
  id?: number;
  key: string;
  value: any;
  timestamp: number;
}
