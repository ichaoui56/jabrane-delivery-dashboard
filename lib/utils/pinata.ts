"server only"

import { PinataSDK } from "pinata"

export const pinata = new PinataSDK({
  pinataJwt: `${process.env.PINATA_JWT}`,
  pinataGateway: `${process.env.NEXT_PUBLIC_GATEWAY_URL}`
})

console.log("JWT Token:", process.env.PINATA_JWT?.substring(0, 20) + "...");
console.log("Gateway URL:", process.env.NEXT_PUBLIC_GATEWAY_URL);