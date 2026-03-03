export const LAYER7_METHODS = [
  "GET", "POST", "OVH", "RHEX", "STOMP", "STRESS", "DYN", "DOWNLOADER", "SLOW",
  "HEAD", "NULL", "COOKIE", "PPS", "EVEN", "GSB", "DGB", "AVB", "BOT",
  "APACHE", "XMLRPC", "CFB", "CFBUAM", "BYPASS", "BOMB", "KILLER", "TOR"
] as const

export const LAYER4_METHODS = [
  "TCP", "UDP", "SYN", "OVH-UDP", "CPS", "ICMP", "CONNECTION", "VSE", "TS3",
  "FIVEM", "FIVEM-TOKEN", "MEM", "NTP", "MCBOT", "MINECRAFT", "MCPE",
  "DNS", "CHAR", "CLDAP", "ARD", "RDP"
] as const

export const METHOD_LABELS: Record<string, string> = {
  GET: "GET Flood",
  POST: "POST Flood",
  OVH: "Bypass OVH",
  RHEX: "Random HEX",
  STOMP: "Bypass chk_captcha",
  STRESS: "HTTP Packet With High Byte",
  DYN: "Random SubDomain",
  DOWNLOADER: "Reading data slowly",
  SLOW: "Slowloris",
  HEAD: "HEAD",
  NULL: "Null UserAgent",
  COOKIE: "Random Cookie PHP",
  PPS: "GET / HTTP/1.1",
  EVEN: "GET with more header",
  GSB: "Google Project Shield Bypass",
  DGB: "DDoS Guard Bypass",
  AVB: "Arvan Cloud Bypass",
  BOT: "Like Google bot",
  APACHE: "Apache Exploit",
  XMLRPC: "WP XMLRPC exploit",
  CFB: "CloudFlare Bypass",
  CFBUAM: "CloudFlare Under Attack Bypass",
  BYPASS: "Bypass Normal AntiDDoS",
  BOMB: "Bypass bombardier",
  KILLER: "Run many threads",
  TOR: "Bypass onion website",
  TCP: "TCP Flood",
  UDP: "UDP Flood",
  SYN: "SYN Flood",
  "OVH-UDP": "UDP OVH bypass",
  CPS: "Open/close connections",
  ICMP: "ICMP echo flood",
  CONNECTION: "Connection alive",
  VSE: "Valve Source Engine",
  TS3: "TeamSpeak 3",
  FIVEM: "FiveM Status Ping",
  "FIVEM-TOKEN": "FiveM token flood",
  MEM: "Memcached Amplification",
  NTP: "NTP Amplification",
  MCBOT: "Minecraft Bot",
  MINECRAFT: "Minecraft Status Ping",
  MCPE: "Minecraft PE",
  DNS: "DNS Amplification",
  CHAR: "Chargen Amplification",
  CLDAP: "CLDAP Amplification",
  ARD: "Apple Remote Desktop",
  RDP: "RDP Amplification",
}

export type Layer7Method = typeof LAYER7_METHODS[number]
export type Layer4Method = typeof LAYER4_METHODS[number]
export type MethodType = "layer7" | "layer4"

export const DEFAULT_CONFIG = {
  threads: 2000,
  rpc: 100,
  duration: 120,
  protocolId: 74,
}

export const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Gecko/20100101 Firefox/121.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
]

export const REFERERS = [
  "https://www.google.com/",
  "https://www.facebook.com/",
  "https://www.bing.com/",
]
