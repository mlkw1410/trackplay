export const speedData = Array.from({ length: 20 }, (_, i) => ({
  time: i,
  speed: Math.max(10, Math.min(35, 20 + Math.sin(i / 2) * 10 + (Math.random() * 5 - 2.5)))
}));
