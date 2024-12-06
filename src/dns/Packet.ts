import { off } from "process";
import {
  Header,
  DNSQuestion,
  DNSAnswer,
  DNSClass,
  DNSType,
} from "../Interfaces/Interfaces";

export class Packet {
  //State
  /**
   * --Header constructor values
   */

  private headerValues: Header = {
    id: 1234,
    qr: 1,
    opcode: 0,
    aa: 0,
    tc: 0,
    rd: 0,
    ra: 0,
    z: 0,
    rcode: 0,
    qdcount: 0,
    ancount: 0,
    nscount: 0,
    arcount: 0,
  };

  private static DNSTypeValues: DNSType = {
    A: 1,
    NS: 2,
    MD: 3,
    MF: 4,
    CNAME: 5,
    SOA: 6,
    MB: 7,
    MR: 9,
    NULL: 10,
    WKS: 11,
    PTR: 12,
    HINFO: 13,
    MINFO: 14,
    MX: 15,
    TXT: 16,
  };

  private static DNSClassValues: DNSClass = {
    IN: 1,
    CS: 2,
    CH: 3,
    HS: 4,
  };

  private questionValues: DNSQuestion = {
    name: "ghost.io",
    type: Packet.DNSTypeValues.A,
    qclass: Packet.DNSClassValues.IN,
  };

  private answerValues: DNSAnswer = {
    name: "ghost.io",
    type: Packet.DNSTypeValues.A,
    aclass: Packet.DNSClassValues.IN,
    ttl: 60,
    data: "1.2.3.4",
  };

  private questions: DNSQuestion[] = [];
  private answers: DNSAnswer[] = [];

  private offset: number = 12;

  //Constructor
  constructor(buf: Buffer) {
    if (buf.length < 12) {
      throw new Error("Received buffer is too short for a DNS packet.");
    }

    try {
      this.answers.push(this.answerValues);

      const headerFlags: number = buf.readUInt16BE(2);
      this.headerValues.id = buf.readUInt16BE(0);
      this.headerValues.opcode = (headerFlags >> 11) & 0x0f;
      this.headerValues.rd = (headerFlags >> 8) & 0x1;
      this.headerValues.rcode = (headerFlags >> 0) & 0x0f;

      // Initialize question and answer counts based on actual data if available
      this.headerValues.qdcount = buf.readUInt16BE(4);
      this.headerValues.ancount = this.answers.length;
      this.headerValues.nscount = buf.readUInt16BE(8);
      this.headerValues.arcount = buf.readUInt16BE(10);

      this.offset = this.parseQuestions(buf, this.offset);
    } catch (error) {
      console.error("Error processing DNS packet:", error);
    }
  }

  //Behaviour
  /**
   * toBuffer() -> buffer with Header, Question,Answer
   */

  private parseQuestions(buf: Buffer, offset: number): number {
    let currentOffset: number = offset;
    console.log("head", this.questions.length);
    while (this.headerValues.qdcount > this.questions.length) {
      let labels: string[] = [];

      while (buf[currentOffset] !== 0) {
        const length = buf[currentOffset];
        currentOffset += 1;

        labels.push(
          buf.toString("ascii", currentOffset, currentOffset + length)
        );

        currentOffset += length;
      }

      currentOffset += 1;
      const name = labels.join(".");
      console.log(name);
      const type = buf.readUInt16BE(currentOffset);
      currentOffset += 2;
      const qclass = buf.readUInt16BE(currentOffset);
      currentOffset += 2;

      if (
        type !== Packet.DNSTypeValues.A ||
        qclass !== Packet.DNSClassValues.IN
      ) {
        throw new Error(
          `Unsupported question type (${type}) or class (${qclass}).`
        );
      }

      this.questions.push({ name, type, qclass });
    }
    return currentOffset;
  }

  private static questionsToBuffer(questionList: DNSQuestion[]): Buffer {
    return Buffer.concat(
      questionList.map((question: DNSQuestion) => {
        const { name, type, qclass } = question;

        const str: string = name
          .split(".")
          .map((n: string) => `${String.fromCharCode(n.length)}${n}`)
          .join("");

        const typeAndClass = Buffer.alloc(4);
        typeAndClass.writeUInt16BE(type);
        typeAndClass.writeUInt16BE(qclass, 2);

        return Buffer.concat([Buffer.from(str + "\0", "binary"), typeAndClass]);
      })
    );
  }

  private static answerToBuffer(answerList: DNSAnswer[]) {
    return Buffer.concat(
      answerList.map((answer: DNSAnswer) => {
        const { name, type, aclass, ttl, data } = answer;
        const str = name
          .split(".")
          .map((e) => `${String.fromCharCode(e.length)}${e}`)
          .join("");
        const buffer = Buffer.alloc(10);

        buffer.writeUInt16BE(type);
        buffer.writeUInt16BE(aclass, 2);
        buffer.writeUInt16BE(ttl, 4);
        buffer.writeUInt16BE(4, 8);

        const ipBuffer = Buffer.from(
          data.split(".").map((octet) => parseInt(octet, 10))
        );

        return Buffer.concat([
          Buffer.from(str + "\0", "binary"),
          buffer,
          ipBuffer,
        ]);
      })
    );
  }

  toBuffer(): Buffer {
    let header = Buffer.alloc(12);

    header.writeUInt16BE(this.headerValues.id, 0);

    const flags =
      (this.headerValues.qr << 15) |
      (this.headerValues.opcode << 11) |
      (this.headerValues.aa << 10) |
      (this.headerValues.tc << 9) |
      (this.headerValues.rd << 8) |
      (this.headerValues.ra << 7) |
      (this.headerValues.z << 4) |
      this.headerValues.rcode;

    header.writeUInt16BE(flags, 2);

    header.writeUInt16BE(this.headerValues.qdcount, 4);
    header.writeUInt16BE(this.headerValues.ancount, 6);
    header.writeUInt16BE(this.headerValues.nscount, 8);
    header.writeUInt16BE(this.headerValues.arcount, 10);

    const bufQuestion = Packet.questionsToBuffer(this.questions);
    const bufAnswer = Packet.answerToBuffer(this.answers);
    console.log("answer", bufAnswer);

    return Buffer.concat([header, bufQuestion, bufAnswer]);
  }
}
