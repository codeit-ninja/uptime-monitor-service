import { HTTPMonitor } from "./monitors/http";

export const messageCallback = (socket: WebSocket, timeout = 1000) =>
	new Promise<Record<string, any> | undefined>((resolve, reject) => {
		const handler = (data: MessageEvent<string>) => {
			try {
				const message = JSON.parse(data.data) as Record<string, any>;

				if (typeof message === 'object' && !Array.isArray(message) && message !== null) {
					unbind();
					resolve(message);
				} else {
					unbind();
					abort();
				}
			} catch (err) {
				// return the original event to allow customization
				unbind();
				resolve(data);
			}
		};

		const abort = () => reject();

		const unbind = () => {
			clearTimeout(timer);
			socket.removeEventListener('message', handler);
			socket.removeEventListener('error', abort);
			socket.removeEventListener('close', abort);
		};

		socket.addEventListener('message', handler);
		socket.addEventListener('error', abort);
		socket.addEventListener('close', abort);

		const timer = setTimeout(() => {
			unbind();
			resolve(undefined);
		}, timeout);
	});

export const startMonitor = ( monitor: Monitors ) => {
    if( monitor.type === 'HTTP' ) {
        new HTTPMonitor( monitor )
    }
}
