import { createItem, readItem, updateItem } from "@directus/sdk"
import { client } from "../.."

export abstract class Monitor<T = unknown> {
    public timingStart = 0

    public timingEnd = 0

    public online = false

    public status: 'ONLINE' | 'OFFLINE' = 'ONLINE'

    public abstract data: Record<string, any>

    public abstract ping(): Promise<boolean>

    public constructor( protected monitor: Monitors<T> ) {
        setInterval( () => this.run(), monitor.interval * 1000 )
    }

    /**
     * Runs the `ping` method implemented by the actual monitor
     * Also measures the execution time of the `ping` function
     */
    protected async run() {
        client.request(
            readItem('monitors', this.monitor.id, { fields: [
                'id', 
                'name', 
                'interval', 
                'type', 
                'online', 
                'user_created', 
                'date_created', 
                'date_updated',
                'sort',
                'monitor_data',
                'monitors_stats'
            ] })
        )
        .then(response => this.monitor = response)

        this.timingStart = performance.now()
        this.online = await this.ping()
        this.timingEnd = performance.now()

        this.storeResult()
    }

    protected async storeResult() {
        const data: Omit<MonitorsStats, 'id'> = {
            latency: Math.round(this.timingEnd - this.timingStart),
            monitor: this.monitor.id,
            status: this.online ? 'ONLINE' : 'OFFLINE',
            response: this.data
        }

        await client.request(
            createItem('monitors_stats', data)
        )

        /**
         * Prevent triggering alerts from triggering on all updates
         * it will just be triggered when the new state isnt the previous state
         */
        if( this.monitor.online !== this.online ) {
            await client.request(
                updateItem('monitors', this.monitor.id, { online: this.online })
            )
        }
    }
}