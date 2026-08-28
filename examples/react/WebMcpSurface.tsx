import { useEffect, useRef, useState } from "react";
import {
  WebMcpRegistrationController,
  type WebMcpRegistrationReport,
  type WebMcpToolDescriptor,
  type WebMcpToolInvoker
} from "@gessa/webmcp-bridge";

export interface WebMcpSurfaceProps {
  contextKey: string;
  descriptors: readonly WebMcpToolDescriptor[];
  invoke: WebMcpToolInvoker;
}

/** Minimal React composition example; the host remains responsible for authorization. */
export function WebMcpSurface({ contextKey, descriptors, invoke }: WebMcpSurfaceProps) {
  const invokeRef = useRef(invoke);
  const [report, setReport] = useState<WebMcpRegistrationReport>();
  invokeRef.current = invoke;

  useEffect(() => {
    const controller = WebMcpRegistrationController.forDocument(document, {
      invoke: (request) => invokeRef.current(request)
    });
    let current = true;
    void controller.reconcile(descriptors, contextKey).then((next) => {
      if (current) setReport(next);
    });
    return () => {
      current = false;
      controller.dispose();
    };
  }, [contextKey, descriptors]);

  return (
    <output data-webmcp-status={report?.status ?? "starting"}>
      {report?.status === "ready"
        ? `${report.activeCount} Site tools ready`
        : "Site tools are unavailable; normal controls still work"}
    </output>
  );
}
