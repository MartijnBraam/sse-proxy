var express = require('express');
var bodyParser = require('body-parser');

var app = express();
var jsonParser = bodyParser.json();

var clientId = 0;
var clients = {};

app.get('/eventsource/', function(req,res){
    req.socket.setTimeout(Infinity);
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Transfer-Encoding': 'identity'
    });
    console.log('New event listener connected');
    res.write('\n');
    (function(clientId) {
        clients[clientId] = res;
        req.on("close", function(){delete clients[clientId]});
    })(++clientId)
});

app.post('/broadcast/', jsonParser, function(req,res){
    if (!req.body) return res.sendStatus(400);

    if (req.body.type == 'event'){
        sendEvent(req.body);
    }
    if (req.body.type == 'raw'){
        sendMessageRaw(req.body.data);
    }

    res.sendStatus(200);
});

function sendMessageRaw(data){
    console.log('Publishing: '+data);
    for (var id in clients){
        clients[id].write(data);
    };
}

function sendEvent(data){
    var message = "";
    if (data.name){
        message+="event: " + data.name +"\n";
    }
    var lines = data.data.split("\n");
    message+="data: " + lines.join("\ndata: ");
    sendMessageRaw(message+"\n\n");
}
console.log("Starting eventsource proxy");
app.listen(process.env.PORT || 8088);
