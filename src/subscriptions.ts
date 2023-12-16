import { SubscribeOptions } from "@directus/sdk";
import WS, { WsNotAuthenticatedError, WsNotConnectedError } from "./ws";
import { client } from "..";
import { messageCallback } from "./utils";

export type MonitorEvents = {
    'monitors::init': (monitors: Monitors[]) => void;
    'monitors::created': (monitor: Monitors) => void;
    'monitors::updated': (monitor: Monitors) => void;
    'monitors::deleted': (monitor: string) => void;
    'monitors_stats::created': (stats: MonitorsStats) => void;
}

export type WsEvents = {
    [K in keyof MonitorEvents]: MonitorEvents[K][];
}

async function* createAsyncGenerator( message: MessageEvent<any> ) {
    while(true) {
        yield message;
    }
}

function createStream( message: MessageEvent<any> ) {
    const generator = createAsyncGenerator( message ).next()


    return createAsyncGenerator( message );
}

// const { subscription, unsubscribe } = await client.subscribe('test', {
// 	query: { fields: ['*'] },
// });

export class Subscriptions {
    /**
     * List of emitted events
     * 
     * @var
     */
    protected events: WsEvents = {
        "monitors::init": [],
        "monitors::created": [],
        "monitors::updated": [],
        "monitors::deleted": [],
        "monitors_stats::created": []
    }

    constructor(protected websocket: WS) {
        if (websocket.connected === false) {
            throw new WsNotConnectedError;
        }

        if (websocket.isAuthenticated === false) {
            throw new WsNotAuthenticatedError;
        }

        this.monitorSubscription();
    }

    public async monitorSubscription() {
        const { subscription } = await this.subscribe('monitors', {
            event: 'create',
            query: { fields: ['*'], limit: 100 }
        })

        //console.log(subscription)

        for await ( const message of subscription ) {
            if( message.type !== 'subscription' ) {
                continue;
            }

            if( message.event === 'init' ) {
                //console.log(message.data)
                this.emit('monitors::init', message.data);
            }
        }
    }

    public async subscribe<T extends keyof CustomDirectusTypes>(collection: T, options?: SubscribeOptions<CustomDirectusTypes, T> | undefined) {
        const ws = this.websocket;
        const data = {
            type: 'subscribe',
            collection,
            query: options?.query
        }
        
        ws.connection.send(JSON.stringify(data));
        
        async function* subscriptionGenerator() {
            while( ws.connected ) {
                const message = await messageCallback( ws.connection )

                if( ! message ) continue;

                if (
                    'type' in message &&
                    'status' in message &&
                    message['type'] === 'subscribe' &&
                    message['status'] === 'error'
                ) {
                    throw message;
                }
                
                yield message;
            }
        }

        return {
            subscription: subscriptionGenerator()
        }
    }

    public on<T extends keyof MonitorEvents>(event: T, cb: MonitorEvents[T]) {
        this.events[event].push(cb);
    }

    public emit<T extends keyof MonitorEvents>(event: T, ...data: Parameters<MonitorEvents[T]>) {
        // @ts-ignore
        this.events[event].map(callback => callback.apply(null, data));
    }
}