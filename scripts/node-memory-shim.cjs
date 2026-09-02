// Some restricted build sandboxes do not expose the OS resident-memory file
// that Node reads. Next.js treats process.memoryUsage() as optional telemetry,
// so provide a zeroed fallback only when that OS call is unavailable.
const originalMemoryUsage = process.memoryUsage.bind(process);

function safeMemoryUsage() {
  try {
    return originalMemoryUsage();
  } catch {
    return {
      rss: 0,
      heapTotal: 0,
      heapUsed: 0,
      external: 0,
      arrayBuffers: 0,
    };
  }
}

safeMemoryUsage.rss = () => {
  try {
    return originalMemoryUsage.rss();
  } catch {
    return 0;
  }
};

process.memoryUsage = safeMemoryUsage;
