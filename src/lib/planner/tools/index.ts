import { queryOrders, queryOrdersArgsSchema, definitionForPrompt as ordersDefn, type QueryOrdersResult } from './queryOrders';
import { queryCustomers, queryCustomersArgsSchema, definitionForPrompt as customersDefn, type QueryCustomersResult } from './queryCustomers';
import { queryLeads, queryLeadsArgsSchema, definitionForPrompt as leadsDefn, type QueryLeadsResult } from './queryLeads';
import { queryProducts, queryProductsArgsSchema, definitionForPrompt as productsDefn, type QueryProductsResult } from './queryProducts';
import { queryTasks, queryTasksArgsSchema, definitionForPrompt as tasksDefn, type QueryTasksResult } from './queryTasks';
import { queryReps, queryRepsArgsSchema, definitionForPrompt as repsDefn, type QueryRepsResult } from './queryReps';
import type { ZodSchema } from 'zod';

export type ToolResult =
  | QueryOrdersResult
  | QueryCustomersResult
  | QueryLeadsResult
  | QueryProductsResult
  | QueryTasksResult
  | QueryRepsResult;

export interface ToolDef {
  schema: ZodSchema;
  execute: (args: unknown) => ToolResult;
  definitionForPrompt: string;
}

export const TOOL_REGISTRY: Record<string, ToolDef> = {
  queryOrders: {
    schema: queryOrdersArgsSchema,
    execute: (args) => queryOrders(queryOrdersArgsSchema.parse(args)),
    definitionForPrompt: ordersDefn,
  },
  queryCustomers: {
    schema: queryCustomersArgsSchema,
    execute: (args) => queryCustomers(queryCustomersArgsSchema.parse(args)),
    definitionForPrompt: customersDefn,
  },
  queryLeads: {
    schema: queryLeadsArgsSchema,
    execute: (args) => queryLeads(queryLeadsArgsSchema.parse(args)),
    definitionForPrompt: leadsDefn,
  },
  queryProducts: {
    schema: queryProductsArgsSchema,
    execute: (args) => queryProducts(queryProductsArgsSchema.parse(args)),
    definitionForPrompt: productsDefn,
  },
  queryTasks: {
    schema: queryTasksArgsSchema,
    execute: (args) => queryTasks(queryTasksArgsSchema.parse(args)),
    definitionForPrompt: tasksDefn,
  },
  queryReps: {
    schema: queryRepsArgsSchema,
    execute: (args) => queryReps(queryRepsArgsSchema.parse(args)),
    definitionForPrompt: repsDefn,
  },
};

export type ToolName = keyof typeof TOOL_REGISTRY;

export {
  queryOrders, queryCustomers, queryLeads, queryProducts, queryTasks, queryReps,
};

export type {
  QueryOrdersResult, QueryCustomersResult, QueryLeadsResult,
  QueryProductsResult, QueryTasksResult, QueryRepsResult,
};
