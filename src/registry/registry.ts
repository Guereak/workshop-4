import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import { REGISTRY_PORT } from "../config";
import { generateRsaKeyPair } from "../crypto";

export type Node = { nodeId: number; pubKey: string };

export type RegisterNodeBody = {
  nodeId: number;
  pubKey: string;
};

export type GetNodeRegistryBody = {
  nodes: Node[];
};

export let activeNodes: Node[];



async function generateKeys() {
  const { publicKey, privateKey } = await generateRsaKeyPair();
}

export async function launchRegistry() {
  const registry = express();
  registry.use(express.json());
  registry.use(bodyParser.json());

  activeNodes = []

  registry.get("/status", (req, res) => {
    res.send("live");
  });

  // Register node endpoint
  registry.post("/registerNode", (req, res) => {
    const { nodeId, pubKey } = req.body as RegisterNodeBody;
    const newNode: Node = { nodeId, pubKey };
    activeNodes.push(newNode);
    res.status(200).send();
  });

  // Get all nodes in the registry
  registry.get("/getNodeRegistry", (req, res) => {
    const payload: GetNodeRegistryBody = {
      nodes: activeNodes
    };
    res.json(payload);
  });

  // Get private key for testing (returns base64)
  registry.get("/getPrivateKey", (req, res) => {
    const nodeId = Number(req.query.nodeId); // Get node ID from query params
    const node = activeNodes.find(n => n.nodeId === nodeId);

    if (!node) {
      return res.status(404).send({ error: "Node not found" });
    }

    return res.json({ result: "base64PrivateKey" });
  });

  const server = registry.listen(REGISTRY_PORT, () => {
    console.log(`Registry is listening on port ${REGISTRY_PORT}`);
  });

  return server;
}
