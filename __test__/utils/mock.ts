import { Mock, mock } from "bun:test";
import { TestDataFactory } from "./factory";

export class TestFactory {
  constructor() { }

  static data:TestDataFactory;
  static createMock<T>(methods: Partial<Record<keyof T, any>> = {}): T {
    return new Proxy({} as any, {
      get(_, prop) {
        if (prop in methods) return methods[prop as keyof T];
        return mock()
      },
    });
  }
}
