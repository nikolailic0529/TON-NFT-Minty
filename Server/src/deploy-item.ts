import { toNano } from "ton-core";
import { readdir } from "fs/promises";

import { openWallet } from "./utils";
import { waitSeqno } from "./delay";
import { NftCollection } from "./contracts/NftCollection";
import { NftItem } from "./contracts/NftItem";
import { updateMetadataFiles, uploadFolderToIPFS } from "./metadata";
import * as fs from 'fs';
import * as path from 'path';

export type DeployResult = {
  imageUrl: String,
  collectionLink: String,
}

export async function deploy_item(imageFilePath: string): Promise<DeployResult> {
  const originalImagesIpfsHash = "Qmbju5CoJBEVmQFeKFKawDTyQJZbVcLjgsxDa6vDD2UVgA";
  const originalMetadataIpfsHash = "QmeMcGVwzNySVizVDXkrvZvj5PjgVwMMbdF9PLe9MxoqYT";

  const imagesFolderPath = "./data/images/";
  const metadataFolderPath = "./data/metadata/";
  
  const currentFiles = await readdir(metadataFolderPath);
  const currentItemCount = currentFiles.length - 1;

  // Copy file to collection folder
  fs.copyFileSync(imageFilePath, path.join(imagesFolderPath, `${currentItemCount}.jpg`));
  const imageFiles = await readdir(imagesFolderPath);
  console.log(imageFiles.length);
  if (imageFiles.length < 3 || currentItemCount + 1 != imageFiles.length - 1) {
    return {
      imageUrl: 'null',
      collectionLink: 'null',
    }
  }
		
  // Create the metadata
  const metadataJson = {
    name: `Superyatch #${currentItemCount}`,
    description: `Superyatch #${currentItemCount}`,
    image: null,
    attributes: [{"trait_type":"Awesomeness","value":"Super cool"}],
  };
  
  fs.writeFileSync(path.join(metadataFolderPath, `${currentItemCount}.json`), JSON.stringify(metadataJson));

  // Open wallet
  const wallet = await openWallet(process.env.MNEMONIC!.split(" "), true);
  console.log(wallet.contract.address);

  // Upload to Pinata
  console.log("Started uploading images to IPFS...");
  const imagesIpfsHash = await uploadFolderToIPFS(imagesFolderPath);
  console.log(
    `Successfully uploaded the pictures to ipfs: https://gateway.pinata.cloud/ipfs/${imagesIpfsHash}`
    );
    
  console.log("Started uploading metadata files to IPFS...");
  await updateMetadataFiles(metadataFolderPath, imagesIpfsHash);
  const metadataIpfsHash = await uploadFolderToIPFS(metadataFolderPath);
  console.log(
    `Successfully uploaded the metadata to ipfs: https://gateway.pinata.cloud/ipfs/${metadataIpfsHash}`
  );
  
  // Update NFT collection content
  console.log("Start deploy new item...");

  const collection = new NftCollection({
    ownerAddress: wallet.contract.address,
    royaltyPercent: 0.05, // 0.05 = 5%
    royaltyAddress: wallet.contract.address,
    nextItemIndex: 0,
    collectionContentUrl: `ipfs://${originalMetadataIpfsHash}/collection.json`,
    commonContentUrl: `ipfs://${originalMetadataIpfsHash}/`,
  });
  let seqno = await collection.changeContent(wallet, {
    collectionContentUrl: `ipfs://${metadataIpfsHash}/collection.json`,
    commonContentUrl: `ipfs://${metadataIpfsHash}/`,
  });
  console.log(`Collection content changed successfully ${collection.address}`);
  await waitSeqno(seqno, wallet);
  
  // Deploy new nft item
  const files = await readdir(metadataFolderPath);
  files.pop();

  seqno = await collection.topUpBalance(wallet, 1);
  await waitSeqno(seqno, wallet);
  console.log(`Balance top-upped`);

  for (let index = currentItemCount; index < files.length; index ++) {
    const file = files[index];
    console.log(`Start deploy of ${index + 1} NFT`);
    const mintParams = {
      queryId: 0,
      itemOwnerAddress: wallet.contract.address,
      itemIndex: index,
      amount: toNano("0.05"),
      commonContentUrl: file,
    };
    const nftItem = new NftItem(collection);
    seqno = await nftItem.deploy(wallet, mintParams);
    console.log(`Successfully deployed ${index + 1} NFT`);
    await waitSeqno(seqno, wallet);
  }

  return {
    imageUrl: `https://gateway.pinata.cloud/ipfs/${imagesIpfsHash}/${currentItemCount}.jpg`,
    collectionLink: `https://testnet.getgems.io/collection/${collection.address}`
  };
}
