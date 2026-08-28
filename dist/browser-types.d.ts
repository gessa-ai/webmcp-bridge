import type { WebMcpModelContext } from "./contracts.js";
declare global {
    interface Document {
        /** Experimental WebMCP imperative API. Absent in unsupported browsers. */
        readonly modelContext?: WebMcpModelContext;
    }
}
export {};
