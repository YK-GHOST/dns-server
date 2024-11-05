import dgram from "dgram";
import { AddressInfo } from "net";
import { Packet } from "./dns/Packet";
const udpSocket: dgram.Socket = dgram.createSocket("udp4");

udpSocket.bind(2053, "127.0.0.1");

udpSocket.on("message", (buf: Buffer, rinfo: dgram.RemoteInfo) => {
  try {
    console.log("buf", buf);
    const packet = new Packet(buf);
    const response = packet.toBuffer();
    console.log("response", response);
    udpSocket.send(response, rinfo.port, rinfo.address); //TO be updated
  } catch (err) {
    console.log(`Eror recieving data: ${err}`);
  }
});

udpSocket.on("error", (err: Error) => {
  console.error(err);
});

udpSocket.on("listening", () => {
  const address: AddressInfo = udpSocket.address() as AddressInfo;
  console.log(`Server is Listening ${address.address}:${address.port}`);
});
