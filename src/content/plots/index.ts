import { accused } from "./accused";
import { apprentice } from "./apprentice";
import { batch } from "./batch";
import { birthing } from "./birthing";
import { boundary } from "./boundary";
import { breakdown } from "./breakdown";
import { comet } from "./comet";
import { commission } from "./commission";
import { complaint } from "./complaint";
import { contest } from "./contest";
import { debt } from "./debt";
import { drawn } from "./drawn";
import { estate } from "./estate";
import { exam } from "./exam";
import { feast } from "./feast";
import { fever } from "./fever";
import { fine } from "./fine";
import { fire } from "./fire";
import { firstday } from "./firstday";
import { flood } from "./flood";
import { follower } from "./follower";
import { gift } from "./gift";
import { glut } from "./glut";
import { ground } from "./ground";
import { herds } from "./herds";
import { hoard } from "./hoard";
import { jesa } from "./jesa";
import { labour } from "./labour";
import { ledger } from "./ledger";
import { levy } from "./levy";
import { locusts } from "./locusts";
import { longing } from "./longing";
import { loose } from "./loose";
import { marriage } from "./marriage";
import { matchmaker } from "./matchmaker";
import { naming } from "./naming";
import { qingming } from "./qingming";
import { quake } from "./quake";
import { quarrel } from "./quarrel";
import { rack } from "./rack";
import { rain } from "./rain";
import { rent } from "./rent";
import { rival } from "./rival";
import { robbery } from "./robbery";
import { ruler } from "./ruler";
import { run } from "./run";
import { shift } from "./shift";
import { sickness } from "./sickness";
import { slack } from "./slack";
import { smuggler } from "./smuggler";
import { sorcery } from "./sorcery";
import { store } from "./store";
import { stray } from "./stray";
import { tithe } from "./tithe";
import { toga } from "./toga";
import { token } from "./token";
import { traders } from "./traders";
import { wandering } from "./wandering";
import { well } from "./well";
import { whale } from "./whale";
import { wreck } from "./wreck";
import type { PlotRole, PlotTemplate } from "./types";

export const PLOTS: PlotTemplate[] = [debt, rent, levy, accused, rival, robbery, feast, gift, marriage, sorcery, ground, stray, complaint,
  estate, fine, commission, exam, fire, tithe,
  run, apprentice, breakdown, rain, birthing, batch, slack, herds, glut, shift, ledger,
  labour, fever, firstday, wandering, quarrel, drawn, longing, jesa, qingming, toga, naming,
  comet, quake, flood, locusts, whale, wreck, hoard, ruler, sickness, traders,
  boundary, store, smuggler, rack, token, well, contest, loose, follower, matchmaker];

export const ROLE_NAMES: Record<PlotRole, string> = {
  creditor: "Creditor", landlord: "Landlord", official: "Official", accuser: "Accuser",
  witness: "Witness", rival: "Rival", suspect: "Suspect", host: "Host",
  giver: "Giver", inlaw: "In-law", claimant: "Claimant", elder: "Elder", customer: "Customer", patron: "Patron",
  kin: "Kin", friend: "Friend", neighbour: "Neighbour", stranger: "Stranger", child: "Child", helper: "Helper",
  buyer: "Buyer", beloved: "Beloved",
};
