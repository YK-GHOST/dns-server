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
    qr: 1 << 15,
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
    name: "codecrafters.io",
    type: Packet.DNSTypeValues.A,
    qclass: Packet.DNSClassValues.IN,
  };

  private answerValues: DNSAnswer = {
    name: "codecrafters.io",
    type: Packet.DNSTypeValues.A,
    aclass: Packet.DNSClassValues.IN,
    ttl: 60,
    data: "1.2.3.4",
  };

  private questions: DNSQuestion[] = [];
  private answers: DNSAnswer[] = [];

  //Constructor
  constructor(buf: Buffer) {
    if (buf.length < 12) {
      throw new Error("Received buffer is too short for a DNS packet.");
    }

    try {
      const headerFlags = buf.readUInt16BE(2);
      this.headerValues.id = buf.readUInt16BE(0);
      this.headerValues.opcode = (headerFlags >> 11) & 0x0f;
      this.headerValues.rd = (headerFlags >> 8) & 0x1;
      this.headerValues.rcode = (headerFlags >> 0) & 0x0f;

      // Initialize question and answer counts based on actual data if available
      this.headerValues.qdcount = this.questions.length;
      this.headerValues.ancount = this.answers.length;

      this.questions.push(this.questionValues);
      this.answers.push(this.answerValues);
    } catch (error) {
      console.error("Error processing DNS packet:", error);
    }
  }

  //Behaviour
  /**
   * toBuffer() -> buffer with Header, Question,Answer
   */

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

  toBuffer(): Buffer {
    let header = Buffer.alloc(12);

    header.writeUInt16BE(this.headerValues.id, 0);

    const flags =
      this.headerValues.qr |
      this.headerValues.opcode |
      this.headerValues.aa |
      this.headerValues.tc |
      this.headerValues.rd |
      this.headerValues.ra |
      this.headerValues.z |
      this.headerValues.z;

    header.writeUInt16BE(flags, 2);

    header.writeUInt16BE(this.headerValues.qdcount, 4);
    header.writeUInt16BE(this.headerValues.ancount, 6);
    header.writeUInt16BE(this.headerValues.nscount, 8);
    header.writeUInt16BE(this.headerValues.arcount, 10);

    const bufQuestion = Packet.questionsToBuffer(this.questions);

    return Buffer.concat([header, bufQuestion]);
  }
}
