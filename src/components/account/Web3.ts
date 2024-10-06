import { Web3 } from "web3";

import documentAbi from './document_abi.json';

const web3 = new Web3(window.ethereum);

const contract = new web3.eth.Contract(documentAbi, import.meta.env.VITE_CONTRACT_ADDRESS);

async function connectAccount(): Promise<void> {
  await window.ethereum.request({ method: 'eth_requestAccounts' })
}

async function getDefaultAddress(): Promise<string> {
  const accounts = await window.ethereum.request({ method: 'eth_accounts' })
  return accounts[0];
}

async function uploadFileToIpfs(file: File): Promise<string> {
  const fileFormData = new FormData();
  fileFormData.set('file', file);
  const result = await fetch(`${import.meta.env.VITE_IPFS_RPC_URL}/add?pin=true`, {
    method: 'POST',
    body: fileFormData,
  });

  return (result.ok) ? (await result.json()).cid : "";
}


async function createMetadataToIpfs(metadata: FormData, blobUri: string): Promise<string> {
  const metadataPayload = {
    "description": "",
    "name": metadata.get('documentTitle'),
    "issued_to": metadata.get('issuedTo'),
    "issuer": metadata.get('issuer'),
    "document": `${import.meta.env.VITE_IPFS_PUBLIC_URL}/ipfs/${blobUri}`,
  };
  
  const jsonFormData = new FormData();
  jsonFormData.append('file', new Blob([JSON.stringify(metadataPayload)], { type: 'application/json' }));
  
  const result = await fetch(`${import.meta.env.VITE_IPFS_RPC_URL}/add?pin=true`, {
    method: 'POST',
    body: jsonFormData,
  });
  return (result.ok) ? (await result.json()).cid : "";
}

async function issueToSmartContract(metadata: FormData, metadataUri: string, isPublic: boolean): Promise<string | undefined> {
  try {
    const receipt = await contract.methods.safeMintDocument(
      metadata.get('issuedTo'),
      `${import.meta.env.VITE_IPFS_PUBLIC_URL}/ipfs/${metadataUri}`, 
      isPublic
    ).send({
      from: await getDefaultAddress(),
      type: "0x0"
    });
    const txHash = receipt.transactionHash;

    console.log(`Document issued! Transaction hash: ${txHash}`);
    return txHash;
  } catch (err) {
    console.error(err);
    return undefined;
  }
}

async function issueDocument(metadata: FormData, isPublic: boolean, file: File): Promise<string | undefined> {
  console.log('issue document function called');
  const documentUri = await uploadFileToIpfs(file);
  console.log(`Document URI: ${documentUri}`);
  const metadataUri = await createMetadataToIpfs(metadata, documentUri);
  console.log(`Metadata URI: ${metadataUri}`);
  return await issueToSmartContract(metadata, metadataUri, isPublic);
}

export default {
  connectAccount: connectAccount,
  getDefaultAddress: getDefaultAddress,
  issueDocument: issueDocument,
};