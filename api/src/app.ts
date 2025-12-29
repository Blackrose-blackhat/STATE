import fastify from "fastify";
import cors from "@fastify/cors"
export function buildApp() {
    const app = fastify({
        logger:true,
    });

    app.register(cors, {
        origin:true,
    })

    return app;
}