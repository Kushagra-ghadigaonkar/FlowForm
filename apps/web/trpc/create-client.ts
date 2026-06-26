import { httpLink, httpBatchStreamLink } from "@repo/trpc/client";
import { env } from "~/env.js";

interface CreateTRPCHttpBatchClientClientOpts {
  enableStreaming?: boolean;
}

const getTrpcUrl = () => {
  const apiUrl = env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (!apiUrl) return "/trpc";
  return apiUrl.endsWith("/trpc") ? apiUrl : `${apiUrl}/trpc`;
};

export const createTRPCHttpBatchClientClient = (opts?: CreateTRPCHttpBatchClientClientOpts) => {
  const c = opts?.enableStreaming ? httpBatchStreamLink : httpLink;
  return c({
    url: getTrpcUrl(),
    fetch(url, options) {
      return fetch(url, {
        ...options,
        credentials: "include",
      });
    },
  });
};
