import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bwfrztgrvzwifozcpisp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3ZnJ6dGdydnp3aWZvemNwaXNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5OTMxNjMsImV4cCI6MjA3ODU2OTE2M30.KhgDXB8Wgt_2Ow8hlLr1S9bvXNdYhH65Sh1vH7AXDSM';

const fetchWithTimeout = (url: RequestInfo | URL, options: RequestInit = {}) => {
  const timeout = 120000; // Increased to 120 seconds (2 minutes)
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  // Handle existing signal if passed by Supabase (e.g. for cancellations)
  const { signal } = options;
  if (signal) {
      if (signal.aborted) {
        controller.abort();
      } else {
        signal.addEventListener('abort', () => {
          clearTimeout(id);
          controller.abort();
        });
      }
  }

  return window.fetch(url, {
    ...options,
    signal: controller.signal
  }).finally(() => {
    clearTimeout(id);
  });
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: fetchWithTimeout
  }
});