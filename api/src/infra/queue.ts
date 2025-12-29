import { Queue } from "bullmq";
import { redis } from "./redis";

export const matchQueue = new Queue("match-simulation", {
  connection: redis,
});
