import {
  Contract,
  ContractProvider,
  Sender,
  Address,
  Cell,
  contractAddress,
  beginCell,
} from "ton-core";
import { Buffer } from "buffer";
import { encodeOffChainContent } from "./utils";

export type CollectionData = {
  ownerAddress: Address;
  royaltyPercent: number;
  royaltyAddress: Address;
  nextItemIndex: number;
  collectionContentUrl: string;
  commonContentUrl: string;
};

export type ChangeContentParams = {
  royaltyPercent: number;
  royaltyAddress: Address;
  collectionContentUrl: string;
  commonContentUrl: string;
};

export type MintParams = {
  queryId: number;
  itemOwnerAddress: Address;
  itemIndex: number;
  amount: bigint;
  commonContentUrl: string;
};

export default class NFTCollection implements Contract {
  static createDataCell(data: CollectionData): Cell {
    const dataCell = beginCell();

    dataCell.storeAddress(data.ownerAddress);
    dataCell.storeUint(data.nextItemIndex, 64);

    const contentCell = beginCell();

    const collectionContent = encodeOffChainContent(data.collectionContentUrl);

    const commonContent = beginCell();
    commonContent.storeBuffer(Buffer.from(data.commonContentUrl));

    contentCell.storeRef(collectionContent);
    contentCell.storeRef(commonContent.asCell());
    dataCell.storeRef(contentCell);

    const NftItemCodeCell = Cell.fromBase64(
      "te6cckECDQEAAdAAART/APSkE/S88sgLAQIBYgMCAAmhH5/gBQICzgcEAgEgBgUAHQDyMs/WM8WAc8WzMntVIAA7O1E0NM/+kAg10nCAJp/AfpA1DAQJBAj4DBwWW1tgAgEgCQgAET6RDBwuvLhTYALXDIhxwCSXwPg0NMDAXGwkl8D4PpA+kAx+gAxcdch+gAx+gAw8AIEs44UMGwiNFIyxwXy4ZUB+kDUMBAj8APgBtMf0z+CEF/MPRRSMLqOhzIQN14yQBPgMDQ0NTWCEC/LJqISuuMCXwSED/LwgCwoAcnCCEIt3FzUFyMv/UATPFhAkgEBwgBDIywVQB88WUAX6AhXLahLLH8s/Im6zlFjPFwGRMuIByQH7AAH2UTXHBfLhkfpAIfAB+kDSADH6AIIK+vCAG6EhlFMVoKHeItcLAcMAIJIGoZE24iDC//LhkiGOPoIQBRONkchQCc8WUAvPFnEkSRRURqBwgBDIywVQB88WUAX6AhXLahLLH8s/Im6zlFjPFwGRMuIByQH7ABBHlBAqN1viDACCAo41JvABghDVMnbbEDdEAG1xcIAQyMsFUAfPFlAF+gIVy2oSyx/LPyJus5RYzxcBkTLiAckB+wCTMDI04lUC8ANqhGIu"
    );
    dataCell.storeRef(NftItemCodeCell);

    const royaltyBase = 1000;
    const royaltyFactor = Math.floor(data.royaltyPercent * royaltyBase);

    const royaltyCell = beginCell();
    royaltyCell.storeUint(royaltyFactor, 16);
    royaltyCell.storeUint(royaltyBase, 16);
    royaltyCell.storeAddress(data.royaltyAddress);
    dataCell.storeRef(royaltyCell);

    return dataCell.endCell();
  }

  static createForDeploy(code: Cell, initData: CollectionData): NFTCollection {
    const data = this.createDataCell(initData);
    const workchain = 0; // deploy to workchain 0
    const address = contractAddress(workchain, { code, data });
    return new NFTCollection(address, { code, data });
  }

  async sendDeploy(provider: ContractProvider, via: Sender) {
    await provider.internal(via, {
      value: "0.05", // send 0.01 TON to contract for rent
      bounce: false,
    });
  }

  async getCollectionData(provider: ContractProvider) {
    const { stack } = await provider.get("get_collection_data", []);
    return {
      nextItemIndex: stack.readBigNumber(),
      content: stack.readCell(),
      ownerAddress: stack.readAddress(),
    };
  }

  async sendTopUpBalance(provider: ContractProvider, via: Sender, nftAmount: number) {
    const amount = nftAmount * 0.026;

    await provider.internal(via, {
      value: amount.toString(),
      body: new Cell(),
    });
  }

  async sendChangeContent(provider: ContractProvider, via: Sender, params: ChangeContentParams) {
    const messageBody = beginCell();

    messageBody.storeUint(4, 32); // op
    messageBody.storeUint(0, 64); // query_id

    // Content
    const contentCell = beginCell();

    const collectionContent = encodeOffChainContent(params.collectionContentUrl);

    const commonContent = beginCell();
    commonContent.storeBuffer(Buffer.from(params.commonContentUrl));

    contentCell.storeRef(collectionContent);
    contentCell.storeRef(commonContent.asCell());
    messageBody.storeRef(contentCell);

    // Royalty
    const royaltyBase = 1000;
    const royaltyFactor = Math.floor(params.royaltyPercent * royaltyBase);

    const royaltyCell = beginCell();
    royaltyCell.storeUint(royaltyFactor, 16);
    royaltyCell.storeUint(royaltyBase, 16);
    royaltyCell.storeAddress(params.royaltyAddress);
    messageBody.storeRef(royaltyCell);

    await provider.internal(via, {
      value: "0.05",
      body: messageBody.endCell(),
    });
  }

  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell }
  ) {}
}
