import { Request } from "express";

class UsersQueries {
  static getParam(value: string | string[] | undefined): string {
    return Array.isArray(value) ? value[0] || "" : value || "";
  }

  static userId(req: Request): string {
    return this.getParam((req.params as { id?: string | string[] }).id);
  }

  static docId(req: Request): string {
    return this.getParam((req.params as { docId?: string | string[] }).docId);
  }
}

export const usersQueries = UsersQueries;

export default usersQueries;
