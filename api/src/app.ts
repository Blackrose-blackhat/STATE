import fastify from "fastify";
import cors from "@fastify/cors"
import { matchRoutes } from "./routes/matches";
import { resultRoutes } from "./routes/results";
export function buildApp() {
    const app = fastify({
        logger:true,
    });

    app.register(cors, {
        origin:true,
    })
    app.register(matchRoutes)
    app.register(resultRoutes)

    return app;
}