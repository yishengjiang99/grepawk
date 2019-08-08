const express = require('express');
const router = express.Router();
const {
    ServiceBusClient,
    ReceiveMode
} = require("@azure/service-bus");
const sbClient = ServiceBusClient.createFromConnectionString(process.env.AZURE_SERVICEBUS_CONNECTION_STRING);

router.get("/receive", async (req, res) => {
    var queueClient;
    try {
        queueClient = sbClient.createQueueClient(req.query.name || "parse_queue");
        const receiver = queueClient.createReceiver(ReceiveMode.receiveAndDelete);
        const num = req.query.num || 1;
        const waitTime = req.query.wait || 1;
        const messages = await receiver.receiveMessages(num, waitTime);
        const msg_bodies = messages.map(message => message.body);
        res.json(msg_bodies);
        res.end();
    } catch (err) {
        res.status(400).send(err.message);
    } finally {
        await queueClient.close();
    }
});

router.get("/peek", async (req, res) => {
    var queueClient;
    try {
        queueClient = sbClient.createQueueClient(req.query.name || "parse_queue");
        const receiver = queueClient.createReceiver(ReceiveMode.PeekLock);
        const messages = await receiver.receiveMessages(req.query.num || 1);
        const msg_bodies = messages.map(message => message.body);
        res.json(msg_bodies);
        // const msg_bodies = messages.map(message => message.body);
        //      res.json(msg_bodies);
        //    res.end();
    } catch (err) {
        res.status(500).end(err.message);
    } finally {
        await queueClient.close();
    }
});


router.post("/send", async (req, res) => {
    var queueClient;
    try {
        queueClient = sbClient.createQueueClient(req.query.name || "parse_queue");
        const sender = queueClient.createSender();
        await sender.send({
            body: req.body
        });
        res.status(200).end("ok");
    } catch (err) {
        res.status(500).end(err.message);
    } finally {
        await queueClient.close();
    }
});

router.get("/healthcheck", async (req, res) => {
    try {
        const queueClient = sbClient.createQueueClient(req.query.name || "parse_queue");
        const sender = queueClient.createSender();
        const msg = {
            url: 'https://wikipedia.com',
            level: 0
        };
        await sender.send({
            body: msg
        });
        res.status(200).end("ok");
    } catch (err) {
        res.status(500).end(err.message);
    } finally {
        //        await queueClient.close();
    }
});

module.exports = router