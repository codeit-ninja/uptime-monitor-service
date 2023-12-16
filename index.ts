import { createDirectus } from "@directus/sdk";
import { rest } from "@directus/sdk/rest";
import { authentication } from "@directus/sdk/auth";
import { graphql } from "@directus/sdk/graphql";
import { realtime } from "@directus/sdk/realtime";
import { boot } from './src/application';
import type from "@directus/sdk";

export const client = createDirectus<CustomDirectusTypes>(Bun.env.DIRECTUS_URL)
    .with(rest())
    .with(authentication('json'))
    .with(realtime())

client.setToken(Bun.env.DIRECTUS_TOKEN);

/**
 * Start the websocket connection before booting
 */
await client.connect();

boot();