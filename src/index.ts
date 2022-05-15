import { program } from "commander";
import fs from "fs";
import { join, basename } from "path";
import { providers } from "ethers";
import axios from "axios";
import { IERC721Metadata__factory } from "./contracts";
program.description("Download NFT Worlds Genesis Avatar skins");

program
  .option("-r, --rpc <url>", "RPC URL", "https://cloudflare-eth.com/")
  .option(
    "-o, --output <path>",
    "Output directory for the generated files",
    "./"
  )
  .option(
    "-c, --contract <address>",
    "Contract address of the token. Defaults to 0x05745e72fb8b4a9b51118a168d956760e4a36444",
    "0x05745e72fb8b4a9b51118a168d956760e4a36444"
  )
  .option(
    "-t, --token <token>",
    "Token to fetch, if not provided a random skin will be downloaded",
    Number,
    Math.floor(Math.random() * 10000)
  );

program.action(async ({ contract, token, output, rpc }) => {
  try {
    const provider = new providers.JsonRpcProvider(rpc);
    const metadataContract = IERC721Metadata__factory.connect(
      contract,
      provider
    );
    const metadataUrl = await metadataContract.tokenURI(token);
    const { data: metadata } = await axios.get(metadataUrl);
    // Download metadata.image to output
    let imageUrl = metadata.texture;
    if (imageUrl.startsWith("ipfs://")) {
      imageUrl = `https://ipfs.infura.io/ipfs/${imageUrl.substring(7)}`;
    }
    console.log(`Downloading ${imageUrl}`);
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const image = response.data;
    fs.writeFileSync(join(output, `${token}.png`), image);
  } catch (error) {
    console.error(error);
  }
});

program.parse(process.argv);
