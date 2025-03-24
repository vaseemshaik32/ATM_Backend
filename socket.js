import { request } from 'express';
import { WebSocketServer } from 'ws'; // Import WebSocketServer explicitly

export function setupWebSocketServer(server) {
    const connections = {};
    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws, req) => {
        const urlParams = new URLSearchParams(req.url.split('?')[1]);
        const myid = urlParams.get('myid');
        connections[myid] = [ws, []];
        console.log(`New client connected with the id ` + myid);

        ws.on('message', (message) => {
            const Message = JSON.parse(message);
            //the server received a connection request from the initiator
            if (Message.type === 'connect') {
                try{
                connections[Message.acceptorid][0].send(
                    JSON.stringify({
                        type: 'connectrequest',
                        initiatorid: Message.initiatorid,
                        acceptorid: Message.accetporid,
                        conmessage: 'hey, wanna connect with me?'
                    })
                )}
                catch(error){
                    console.log(error)
                }
            } 
            //the pair guy accepted the connection and this is his response
            else if (Message.type === 'accepted') {
                try{
                const requestfrom = Message.requestfrom;
                const requestto = Message.requestto;
                connections[requestfrom][1].push(requestto);
                connections[requestto][1].push(requestfrom);
                const pairid = Message.requestfrom;
                connections[pairid][0].send(
                    JSON.stringify({
                        type: 'acceptedbythematch',
                        acceptedbyid: requestto,
                        conmessage: `your request has been accepted by ${Message.requestto}`
                    })
                )
            }
            catch(error){
                console.log(error)
            }
            } 
            //conection done. this is message time
            else {
              try{
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
                    console.log('cant send as you are not paired with him');
                }
            }
            catch(error){
                console.log(error)
            }
            }
        });

        ws.on('close', () => {
            console.log('Client disconnected');
        });
    });

    return wss;
}

export default setupWebSocketServer;


/*
{
    "type":"connect",
    "pairid":2

}

{
    "type":"message",
    "msgfrom":2,
    "msgto":1,
    "msg":"hey this is sick shit"
}
    */