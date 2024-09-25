import dgram from "dgram";
import { AddressInfo } from "net";
const udpSocket: dgram.Socket = dgram.createSocket("udp4");

udpSocket.bind(2053, "127.0.0.1");

udpSocket.on("message", (buf: Buffer, rinfo: dgram.RemoteInfo) => {
  udpSocket.send("Message", rinfo.port, rinfo.address); //TO be updated
});

udpSocket.on("error", (err: Error) => {
  console.error(err);
});

udpSocket.on("listening", () => {
  const address: AddressInfo = udpSocket.address() as AddressInfo;
  console.log(`Server is Listening ${address.address}:${address.port}`);
});
