import { SuiGrpcClient } from "@mysten/sui/grpc";
import { walrus } from "@mysten/walrus";

const NETWORK = process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet";
const BASE_URL =
  NETWORK === "testnet"
    ? "https://rpc.testnet.sui.io:443"
    : NETWORK === "devnet"
      ? "https://rpc.devnet.sui.io:443"
      : "http://127.0.0.1:9000";

export const suiClient = new SuiGrpcClient({
  network: NETWORK,
  baseUrl: BASE_URL,
}).$extend(
  walrus({
    uploadRelay: {
      host: "https://upload-relay.testnet.walrus.space",
      sendTip: { max: 1_000 },
    },
  }),
);
