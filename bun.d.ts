declare module "bun" {
    interface Env {
        DIRECTUS_URL: string;
        DIRECTUS_TOKEN: string;
    }
}