import Fastify from 'fastify';
import fastifyMiddie from '@fastify/middie';
import fastifyStatic from '@fastify/static';
import {fileURLToPath} from 'node:url';

import {handler as ssrHandler} from '../dist/server/entry.mjs';

process.env.HOST = "0.0.0.0";

const app = Fastify({logger: true});

await app.register(fastifyStatic, {
        root: fileURLToPath(new URL('../dist/client', import.meta.url)),
    });

await app.register(fastifyMiddie);

app.use('/', async (req, res, next) => {

    res.setHeader('x-powered-by', 'fastify');

    await ssrHandler(req, res, next);

});

app.listen({port:8066, host: '0.0.0.0'});

