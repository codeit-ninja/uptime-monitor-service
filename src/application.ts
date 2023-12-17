import { readItems } from "@directus/sdk"
import { client } from ".."
import { HTTPMonitor } from "./monitors/http"

export const boot = async () => {
    const active: string[] = [];
    
    /**
     * TODO Implement way to retrieve all monitors in badges
     * TODO Then start each monitor induvidualy
     */

    const monitors = await client.request(
        readItems('monitors', {
            fields: ['*'],
            limit: 100
        })
    )

    monitors.forEach(monitor => {
        if( monitor.type === 'HTTP' ) {
            new HTTPMonitor( monitor )
        }
    })

    const { subscription } = await client.subscribe('monitors')

    for await (const item of subscription) {
        if( item.event === 'init' ) {
            item.data.forEach(monitor => new HTTPMonitor( monitor as Monitors ))
        }
    }
}