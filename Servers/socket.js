import { WebSocketServer } from 'ws'; // Import WebSocketServer explicitly
import { expiredTokens } from '../app.js'; // Import expiredTokens
import JWT from 'jsonwebtoken'; // Import JWT for token verification
import userstats from '../Models/userstats.js';
export function setupWebSocketServer(server) {
    const connections = {}; // To store user connections by their `myid`
    const soktotok = new Map(); // Use Map to store WebSocket associations as [token, myid]
    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws, req) => {
        const cookies = parse(req.headers.cookie || '');
        const logintoken = cookies.token; // Get from HttpOnly cookie
        const urlParams = new URLSearchParams(req.url.split('?')[1]);
        const myid = urlParams.get('myid'); // User's unique identifier
        ws.myid=myid
        if (expiredTokens.has(logintoken)) {
        console.log(`Connection attempt with expired token for user ${myid}`);
        ws.close(4001, 'Token is expired'); // Close connection with a custom error code
        return; // Stop further execution for this connection
    }
        // Store the [token, myid] array using the WebSocket as the key
        soktotok.set(ws, [logintoken, myid]);
        if (connections[myid]){
            console.log(`${myid} reconnected`);
            connections[myid][0]=ws;
            }
        else{
        connections[myid] = [ws, []];
        console.log(`New client connected with the id ${myid}`);}

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

ws.on('close', async () => {
    console.log('Client disconnected');
    const idtocheck= ws.myid
    let elapsedSeconds = 0;
    const interval = setInterval(() => {
        // Check if conn[id] === ws
        if (connections[idtocheck][0] !== ws) {
            console.log('Condition met: conn[id] === ws. Exiting early.');
            soktotok.delete(ws);
            clearInterval(interval); // Stop the interval
            return; // Exit without calling foobar
        }
        elapsedSeconds++;
        if (elapsedSeconds >= 6) {
            console.log('Condition not met for 10 seconds. Executing logout .');
            clearInterval(interval); // Stop the interval
            handlewindowclose(ws,soktotok,connections); // Call the foobar function
        }
    }, 1000); // Check every 1 second
});

    });

    return wss;
}


const VerifyToken = (token) => {
        if (!token || expiredTokens.has(token)) {
            throw new Error('Invalid token');
        }
        return JWT.verify(token, process.env.MY_JWT_SECRET);
    };
async function handlewindowclose(ws,soktotok,connections){
        // Retrieve the [token, myid] array using the WebSocket as the key
    const data = soktotok.get(ws);

    if (data) {
        const [token, myid] = data; // Destructure the array to get token and myid

        if (token) {
            try {
                const decodedToken = VerifyToken(token);
                const curuid = decodedToken.userID

                // Perform logout actions
                await userstats.findOneAndUpdate({ userid: curuid }, { userlat: 0, userlong: 0 });
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
}
export default setupWebSocketServer;
