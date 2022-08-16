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
    "-s, --original-size",
    "Download in the original size rather than a minecraft skin compatible size"
  )
  .option(
    "-t, --token <token>",
    "Token to fetch, if not provided a random skin will be downloaded",
    Number,
    Math.floor(Math.random() * 10000)
  );

program.action(async ({ contract, token, output, rpc, originalSize }) => {
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
    const cid = imageUrl.substring(7);
    const finalUrl = `https://image.0xflick.com/ipfs/${cid}?w=${
      originalSize ? "auto" : "64"
    }`;
    console.log(
      `Fetching texture (${cid}) from IPFS, this may take a while.... or fail. If it fails then try again`
    );
    const response = await axios.get(finalUrl, { responseType: "arraybuffer" });
    const image = response.data;
    fs.writeFileSync(join(output, `${token}.png`), image);
    console.log(`Downloaded ${token}.png`);
  } catch (error: any) {
    console.error(error.message);
  }
});

program.parse(process.argv);
