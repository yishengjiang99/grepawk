const express = require('express');
const router = express.Router();
const {
    ServiceBusClient,
    ReceiveMode
} = require("@azure/service-bus");
const sbClient = ServiceBusClient.createFromConnectionString(process.env.AZURE_SERVICEBUS_CONNECTION_STRING);

router.get("/receive", async (req, res) => {
    try {
        const queueClient = sbClient.createQueueClient(req.query.name||"parse");
        const receiver = queueClient.createReceiver(ReceiveMode.receiveAndDelete);
        const messages = await receiver.receiveMessages(req.query.num || 3);
        const msg_bodies = messages.map(message => message.body);
        res.json(msg_bodies);
        res.end();
    } catch(err){
        res.status(400).send(err.message);
    }finally {
        await queueClient.close();
    }
});

router.post("/send", async (req, res) => {
    try {
        const queueClient = sbClient.createQueueClient(req.query.name||"parse");
        const sender = queueClient.createSender();
        var messages = req.body;
        messages.forEach(async m => {
            await sender.send(m);
        });
        res.status(200).end("ok");
    } catch (err) {
        res.status(500).end(err.message);
    } finally{
        await queueClient.close();
    }
});

router.get("/healthcheck", async (req, res) => {
    try {
        const queueClient = sbClient.createQueueClient(req.query.name||"parse");
        const sender = queueClient.createSender();
        await sender.send({body:"check"});
        res.status(200).end("ok");
    } catch (err) {
        res.status(500).end(err.message);
    } finally{
//        await queueClient.close();
    }
});

module.exports = router