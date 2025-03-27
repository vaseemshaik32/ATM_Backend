import { WebSocketServer } from 'ws'; // Import WebSocketServer explicitly 
import { expiredTokens } from './app.js'; // 
import JWT from 'jsonwebtoken'; // Import JWT for token verification 
import userstats from './userstats.js';
export function setupWebSocketServer(server) {
    const connections = {}; // To store user connections by their `myid`
    const soktotok = new Map(); // Use Map to store WebSocket associations as [token, myid]
    const cleanupTimeouts = {}; // Store timeouts for cleanup per user

    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws, req) => {
        const urlParams = new URLSearchParams(req.url.split('?')[1]);
        const myid = urlParams.get('myid'); // User's unique identifier
        const logintoken = urlParams.get('logintoken'); // Login token

        // Check if this user is reconnecting
        if (connections[myid]) {
            console.log(`User ${myid} reconnected`);
            clearTimeout(cleanupTimeouts[myid]); // Cancel any pending cleanup
            connections[myid][0] = ws; // Update WebSocket for the user
            soktotok.set(ws, [logintoken, myid]); // Map new WebSocket
            return;
        }

        // New connection setup
        soktotok.set(ws, [logintoken, myid]);
        connections[myid] = [ws, []]; // [WebSocket, pairedUsers]
        console.log(`New client connected with the id ${myid}`);

        ws.on('message', (message) => {
            const Message = JSON.parse(message);

            if (Message.type === 'connect') {
                try {
                    const acceptorWs = connections[Message.acceptorid][0];
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

                    connections[requestfrom][1].push(requestto);
                    connections[requestto][1].push(requestfrom);

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
            } else if (Message.type === 'message') {
                try {
                    const msgfrom = Message.msgfrom.toString();
                    const msg = Message.msg;
                    const msgto = Message.msgto;

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

        ws.on('close', async () => {
            console.log(`WebSocket closed for user ${myid}`);

            const data = soktotok.get(ws);
            if (data) {
                const [token, myid] = data;

                // Delay cleanup to allow reconnection
                cleanupTimeouts[myid] = setTimeout(async () => {
                    console.log(`Cleaning up for user ${myid}`);

                    if (token) {
                        try {
                            const decodedToken = verifyToken(token);
                            const curuid = decodedToken.userID;

                            // Perform logout actions
                            await userstats.findOneAndUpdate({ userid: curuid }, { userlat: 0, userlong: 0 });
                            await userstats.findOneAndUpdate({ userid: curuid }, { status: false });
                            await userstats.findOneAndUpdate({ userid: curuid }, { needscash: false, needsdigital: false });
                            await userstats.findOneAndUpdate({ userid: curuid }, { tranamount: 0 });
                            expiredTokens.add(token);
                            console.log(`User ${curuid} logged out successfully.`);
                        } catch (error) {
                            console.error('Error during cleanup:', error);
                        }
                    }

                    // Remove connections
                    delete connections[myid];
                    soktotok.delete(ws);
                }, 10000); // 10-second timeout for reconnection
            } else {
                console.error('No token or myid found for the disconnected WebSocket.');
            }
        });
    });

    const verifyToken = (token) => {
        if (!token || expiredTokens.has(token)) {
            throw new Error('Invalid token');
        }
        return JWT.verify(token, process.env.MY_JWT_SECRET);
    };

    return wss;
}
