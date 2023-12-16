import { Monitor } from "./Monitor";

type MonitorData = {
    method: string;
    url: string;
    timeout: number;
}

export class HTTPMonitor extends Monitor<MonitorData> {
    public data: Record<string, any> = {};

    public async ping(): Promise<boolean> {
        try {
            const request = await fetch( this.monitor.monitor_data.url, { 
                method: this.monitor.monitor_data.method, 
                mode: 'no-cors' 
            } );

            this.data.status_code = request.status;

            if( request.status >= 200 && request.status < 300 ) {
                this.status = 'ONLINE';
                return true;
            }
            
            this.status = 'OFFLINE';
            return false;
        } catch(_) {
            this.status = 'OFFLINE';
            return false;
        }
    }
}