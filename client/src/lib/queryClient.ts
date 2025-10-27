import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { logError, ErrorCategory } from "@/lib/errorHandler";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    const error = new Error(`${res.status}: ${text}`);
    (error as any).status = res.status;
    
    // Log error to error handler
    const category = res.status === 401 ? ErrorCategory.AUTH :
                     res.status >= 500 ? ErrorCategory.SERVER :
                     res.status === 404 ? ErrorCategory.CLIENT :
                     ErrorCategory.NETWORK;
    
    logError(error, { 
      url: res.url, 
      status: res.status,
      statusText: res.statusText 
    }, {
      showToast: false, // We'll handle toasts at the component level
      category
    });
    
    throw error;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes instead of infinity
      gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors except 408 (timeout) and 429 (rate limit)
        if (error?.status && error.status >= 400 && error.status < 500) {
          return error.status === 408 || error.status === 429 ? failureCount < 2 : false;
        }
        // Retry network and server errors up to 3 times
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => {
        // Exponential backoff: 1s, 2s, 4s
        return Math.min(1000 * Math.pow(2, attemptIndex), 4000);
      },
      networkMode: 'online', // Only fetch when online
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Only retry network errors for mutations (not validation errors)
        if (error?.status && error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => {
        return Math.min(1000 * Math.pow(2, attemptIndex), 3000);
      },
      networkMode: 'online',
    },
  },
});
