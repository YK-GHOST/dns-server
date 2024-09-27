export interface Header {
  id: number;
  qr: number;
  opcode: number;
  aa: number;
  tc: number;
  rd: number;
  ra: number;
  z: number;
  rcode: number;
  qdcount: number;
  ancount: number;
  nscount: number;
  arcount: number;
}

export interface DNSType {
  A: number;
  NS: number;
  MD: number;
  MF: number;
  CNAME: number;
  SOA: number;
  MB: number;
  MR: number;
  NULL: number;
  WKS: number;
  PTR: number;
  HINFO: number;
  MINFO: number;
  MX: number;
  TXT: number;
}

export interface DNSClass {
  IN: number;
  CS: number;
  CH: number;
  HS: number;
}

export interface DNSQuestion {
  name: String;
  type: number;
  qclass: number;
}

export interface DNSAnswer {
  name: String;
  type: number;
  aclass: number;
  ttl: number;
  data: String;
}
