import bodyParser from "body-parser";
import express from "express";
import { BASE_ONION_ROUTER_PORT } from "../config";
import { GetNodeRegistryBody,  } from "../registry/registry";

export async function simpleOnionRouter(nodeId: number) {
  const onionRouter = express();
  onionRouter.use(express.json());
  onionRouter.use(bodyParser.json());

  let lastReceivedEncryptedMessage: string | null = null;
  let lastReceivedDecryptedMessage: string | null = null;
  let lastMessageDestination: number | null = null;

  onionRouter.get("/status", (req, res) => {
    res.send("live");
  });

  onionRouter.get("/getLastReceivedEncryptedMessage", (req, res) => {
    res.send({result: lastReceivedEncryptedMessage})
  });

  onionRouter.get("/getLastRecievedDecryptedMessage", (req, res) => {
    res.send({result: lastReceivedDecryptedMessage})
  })

  onionRouter.get("/getLastMessageDestination", (req, res) => {
    res.send({result: lastMessageDestination})
  })

  onionRouter.get("/registerNode", (req, res) => {
    res.send({})
  })


  const server = onionRouter.listen(BASE_ONION_ROUTER_PORT + nodeId, () => {
    console.log(
      `Onion router ${nodeId} is listening on port ${
        BASE_ONION_ROUTER_PORT + nodeId
      }`
    );
  });

  return server;
}
