## Overview

Example of minting NFT Collection on TON using ton.js

# Server
### Environment variables

| Name                                     | Description                              |
| ---------------------------------------- | ---------------------------------------- |
| `PINATA_API_KEY`, `PINATA_API_SECRET`| API keys from [pinata.cloud](https://pinata.cloud)|
| `MNEMONIC`                               | 24 mnemonic words of owner wallet        |
| `TONCENTER_API_KEY`                      | API key from [@tonapibot](https://t.me/tonapibot) / [@tontestnetapibot](https:/t.me/tontestnetapibot)                        |

## TWA-Client

### Prerequesities

- Node.js v16 (other versions may work, needs more testing)
- A TON Connect compatible wallet (e.g. [Tonkeeper](https://tonkeeper.com/))

### How to use

1. Create a template from this repo with the "Use this template" button

   1. Choose a name for your repo
   2. `**IMPORTANT!!**` mark "Include all branches", otherwise github pages deployment will not work.
      ![image](https://user-images.githubusercontent.com/5641469/191731317-14e742fd-accb-47d4-a794-fad01148a377.png)

2. Clone this repo and run `yarn`

3. Create a new bot with [botfather](https://t.me/botfather)
   1. Type `/newbot`
   2. Choose a name for your bot, e.g. `My Ton TWA`
   3. Choose a username for your bot, e.g. `my_ton_twa_482765_bot`
   4. Take note of the access token, e.g. `5712441624:AAHmiHvwrrju1F3h29rlVOZLRLnv-B8ZZZ`
   5. Run `yarn configbot` to link your bot to the webapp
