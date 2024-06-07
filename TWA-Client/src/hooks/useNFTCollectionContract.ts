import { useState } from "react";
import NFTCollection, { ChangeContentParams } from "../contracts/nftCollection";
import { useTonClient } from "./useTonClient";
import { useAsyncInitialize } from "./useAsyncInitialize";
import { useTonConnect } from "./useTonConnect";
import { Address, OpenedContract } from "ton-core";
import { useQuery } from "@tanstack/react-query";
import { CHAIN } from "@tonconnect/protocol";

export function useNFTCollectionContract() {
  const { client } = useTonClient();
  const { sender, network } = useTonConnect();

  const nftCollectionContract = useAsyncInitialize(async () => {
    if (!client) return;
    const contract = new NFTCollection(
      Address.parse(
        network === CHAIN.MAINNET
          ? ""
          : String(import.meta.env.VITE_COLLECTION_ADDRESS)
      )
    );
    return client.open(contract) as OpenedContract<NFTCollection>;
  }, [client]);

  const { data, isFetching } = useQuery(
    ["collection_data"],
    async () => {
      if (!nftCollectionContract) return null;
      const collectionData = await nftCollectionContract!.getCollectionData();
      return collectionData;
    },
    { refetchInterval: 3000 }
  );

  return {
    itemCount: isFetching ? null : data?.nextItemIndex,
    ownerAddress: isFetching ? null : data?.ownerAddress,
    address: nftCollectionContract?.address,
    sendTopUpBalance: (nftAmount: number) => {
      return nftCollectionContract?.sendTopUpBalance(sender, nftAmount);
    },
    sendChangeContent: (params: ChangeContentParams) => {
      return nftCollectionContract?.sendChangeContent(sender, params);
    },
  };
}
