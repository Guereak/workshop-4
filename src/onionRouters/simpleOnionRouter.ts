import bodyParser from "body-parser";
import express from "express";
import { BASE_ONION_ROUTER_PORT, REGISTRY_PORT } from "../config";
import { GetNodeRegistryBody,  } from "../registry/registry";
import axios from 'axios';
import { exportPrvKey, exportPubKey, generateRsaKeyPair, rsaDecrypt, symDecrypt } from "../crypto";

const PUB_TO_PRIV = {}


export async function simpleOnionRouter(nodeId: number) {
  const onionRouter = express();
  onionRouter.use(express.json());
  onionRouter.use(bodyParser.json());

  let lastReceivedEncryptedMessage: string | null = null;
  let lastReceivedDecryptedMessage: string | null = null;
  let lastMessageDestination: number | null = null;

  const { publicKey, privateKey } = await generateRsaKeyPair();
  const strPubKey = await exportPubKey(publicKey);
  const strPrvKey = await exportPrvKey(privateKey);


  onionRouter.get("/status", (req, res) => {
    res.send("live");
  });

  onionRouter.get('/getPrivateKey', (req, res) => {
    res.json({result: strPrvKey})
  })

  onionRouter.get("/getLastReceivedEncryptedMessage", (req, res) => {
    res.send({result: lastReceivedEncryptedMessage})
  });

  onionRouter.get("/getLastReceivedDecryptedMessage", (req, res) => {
    res.send({result: lastReceivedDecryptedMessage})
  })

  onionRouter.get("/getLastMessageDestination", (req, res) => {
    res.send({result: lastMessageDestination})
  })

  onionRouter.get("/registerNode", (req, res) => {
    res.send({})
    
  })

  onionRouter.post("/message", async (req, res) => {
    const { message } = req.body;
  
    // Extract encrypted symmetric key and encrypted payload
    const encryptedSymKey = message.slice(0, 344);
    const encryptedPayload = message.slice(344);
  
    const symKeyBase64 = await rsaDecrypt(encryptedSymKey, privateKey);
    const decryptedPayload = await symDecrypt(symKeyBase64, encryptedPayload);
  
    const destination = decryptedPayload.slice(0, 10);
    const innerMessage = decryptedPayload.slice(10);
  
    lastMessageDestination = parseInt(destination, 10);
    lastReceivedDecryptedMessage = innerMessage;
    lastReceivedEncryptedMessage = message;
  
    // Forward the decrypted message to the next node or final destination
    if (lastMessageDestination) {
      await fetch(`http://localhost:${lastMessageDestination}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: lastReceivedDecryptedMessage }),
      });
    } else {
      return res.send("failed");
    }
  
    return res.status(200).send("success");
  });
  

  await fetch(`http://localhost:${REGISTRY_PORT}/registerNode`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nodeId, pubKey: strPubKey }),
  });

  const server = onionRouter.listen(BASE_ONION_ROUTER_PORT + nodeId, () => {
    console.log(
      `Onion router ${nodeId} is listening on port ${
        BASE_ONION_ROUTER_PORT + nodeId
      }`
    );
  });

  return server;
}
