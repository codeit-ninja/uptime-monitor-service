export default class WS {
    public isAuthenticated = false;

    public url = `${Bun.env.DIRECTUS_URL}/websocket`;

    public token = Bun.env.DIRECTUS_TOKEN;

    public connection: WebSocket;

    public connected = false;

    public error: null | Event<EventTarget> | 'TIMEOUT' = null;

    constructor() {
        this.connection = new WebSocket( Bun.env.DIRECTUS_URL + '/websocket' );

        /**
         * Keep the connection alive by replying with a pong when we are pinged
         */
        this.connection.addEventListener( 'message', message => {
            const data = JSON.parse(message.data);

            if( data.type !== 'ping' ) {
                return;
            }

            this.connection.send(
                JSON.stringify({
                    type: 'pong'
                })
            )

            console.log('PONG')
        } )
    }

    public connect() {
        return new Promise( ( resolve, reject ) => {
            this.connection.addEventListener("open", () => {
                this.error = null;
                this.connected = true;

                resolve( this.connected );
                clearTimeout( timeout );

                console.log('CONNECTION OPEN');
            })
            this.connection.addEventListener("error", (event) => {
                this.connected = false;
                this.error = event;

                reject( this.connected );
                clearTimeout( timeout );

                console.log('CONNECTION ERROR', event);
            })
            this.connection.addEventListener("close", () => {
                this.connected = false;

                console.log('CONNECTION CLOSED');
            })

            const timeout = setTimeout( () => {
                this.connected = false;
                this.error = 'TIMEOUT';

                reject(this.connected)

                console.log('CONNECTION TIMEDOUT');
            }, 1000 )
        })
    }

    public authenticate() {
        if( ! this.connected ) {
            throw new WsNotConnectedError();
        }

        return new Promise((resolve, reject) => {
            this.connection.send(
                JSON.stringify({
                    type: 'auth',
                    access_token: this.token
                })
            )

            this.connection.addEventListener('message', (message) => {
                const data = JSON.parse(message.data);
                
                if( data.type !== 'auth' ) {
                    return;
                }

                if(  data.status === 'ok' ) {
                    this.isAuthenticated = true;

                    resolve( true );
                    clearTimeout( timeout );
                } else {
                    this.isAuthenticated = false;
                    this.connected = false;
                    
                    reject( false );
                    clearTimeout( timeout );

                    /**
                     * Close the connection, without authentication we cant do anyting
                     */
                    this.connection.close(1011)
                }
            });

            const timeout = setTimeout( () => {
                this.isAuthenticated = false;
                this.connected = false;
                this.error = 'TIMEOUT';

                reject(this.connected)
            }, 1000 )
        })
    }
}

export class WsNotConnectedError extends Error {
    constructor() { super('Websocket not conntected, did you run .connect()?') }
}

export class WsNotAuthenticatedError extends Error {
    constructor() { super('Not authenticated, did you run .authenticate()?') }
}