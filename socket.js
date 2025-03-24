import { WebSocketServer } from 'ws'; // Import WebSocketServer explicitly
import { expiredTokens } from './app.js'; // Import expiredTokens
import JWT from 'jsonwebtoken'; // Import JWT for token verification

export function setupWebSocketServer(server) {
    const connections = {}; // To store user connections by their `myid`
    const soktotok = new Map(); // Use Map to store WebSocket associations as [token, myid]
    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws, req) => {
        const urlParams = new URLSearchParams(req.url.split('?')[1]);
        const myid = urlParams.get('myid'); // User's unique identifier
        const logintoken = urlParams.get('logintoken'); // Login token

        // Store the [token, myid] array using the WebSocket as the key
        soktotok.set(ws, [logintoken, myid]);

        // Store the WebSocket and paired users in the connections hashmap
        connections[myid] = [ws, []];
        console.log(`New client connected with the id ${myid}`);

        ws.on('message', (message) => {
            const Message = JSON.parse(message);

            // Handle various message types
            if (Message.type === 'connect') {
                try {
                    const acceptorWs = connections[Message.acceptorid][0]; // Get acceptor's WebSocket
                    acceptorWs.send(
                        JSON.stringify({
                            type: 'connectrequest',
                            initiatorid: Message.initiatorid,
                            acceptorid: Message.acceptorid,
                            conmessage: 'hey, wanna connect with me?',
                        })
                    );
                } catch (error) {
                    console.log(error);
                }
            } else if (Message.type === 'accepted') {
                try {
                    const requestfrom = Message.requestfrom;
                    const requestto = Message.requestto;

                    // Manage pairing
                    connections[requestfrom][1].push(requestto);
                    connections[requestto][1].push(requestfrom);

                    // Notify initiator
                    connections[requestfrom][0].send(
                        JSON.stringify({
                            type: 'acceptedbythematch',
                            acceptedbyid: requestto,
                            conmessage: `your request has been accepted by ${Message.requestto}`,
                        })
                    );
                } catch (error) {
                    console.log(error);
                }
            } else {
                try {
                    const msgfrom = Message.msgfrom.toString();
                    const msg = Message.msg;
                    const msgto = Message.msgto;

                    // Ensure users are paired before sending a message
                    if (connections[msgfrom][1].includes(msgto)) {
                        connections[msgto][0].send(
                            JSON.stringify({
                                type: 'message',
                                msgfrom: msgfrom,
                                msg: msg,
                                msgto: msgto,
                            })
                        );
                    } else {
                        console.log('Cannot send message as users are not paired');
                    }
                } catch (error) {
                    console.log(error);
                }
            }
        });

        const verifyToken = (token) => {
            if (!token || expiredTokens.has(token)) {
                throw new Error('Invalid token');
            }
            return JWT.verify(token, process.env.MY_JWT_SECRET);
        };

        ws.on('close', async () => {
            console.log('Client disconnected');

            // Retrieve the [token, myid] array using the WebSocket as the key
            const data = soktotok.get(ws);

            if (data) {
                const [token, myid] = data; // Destructure the array to get token and myid

                if (token) {
                    try {
                        const curuid = verifyToken(token);

                        // Perform logout actions
                        await userstats.findOneAndUpdate({ userid: curuid }, { latitude: 0, longitude: 0 });
                        await userstats.findOneAndUpdate({ userid: curuid }, { status: false });
                        await userstats.findOneAndUpdate({ userid: curuid }, { needscash: false, needsdigital: false });
                        await userstats.findOneAndUpdate({ userid: curuid }, { tranamount: 0 });
                        expiredTokens.add(token);
                        console.log(`User ${curuid} logged out successfully on WebSocket close.`);
                    } catch (error) {
                        console.error('Error verifying token during WebSocket close:', error);
                    }
                }

                // Clean up connections
                delete connections[myid]; // Remove user from connections
            } else {
                console.error('No token or myid found for the disconnected WebSocket.');
            }

            soktotok.delete(ws); // Remove WebSocket entry from soktotok
        });
    });

    return wss;
}

export default setupWebSocketServer;
