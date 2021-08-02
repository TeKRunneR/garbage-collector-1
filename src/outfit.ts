import {
  bjornifyFamiliar,
  booleanModifier,
  cliExecute,
  enthroneFamiliar,
  equip,
  equippedAmount,
  fullnessLimit,
  haveEquipped,
  inebrietyLimit,
  mallPrice,
  myClass,
  myFamiliar,
  myFullness,
  myInebriety,
  numericModifier,
  retrieveItem,
  toSlot,
  totalTurnsPlayed,
} from "kolmafia";
import {
  $class,
  $familiar,
  $item,
  $items,
  $slot,
  get,
  getFoldGroup,
  getKramcoWandererChance,
  have,
  maximizeCached,
} from "libram";
import { pickBjorn, PickBjornMode } from "./bjorn";
import { estimatedTurns, globalOptions } from "./globalvars";
import { baseMeat, Requirement } from "./lib";

const bestAdventuresFromPants =
  Item.all()
    .filter(
      (item) =>
        toSlot(item) === $slot`pants` && have(item) && numericModifier(item, "Adventures") > 0
    )
    .map((pants) => numericModifier(pants, "Adventures"))
    .sort((a, b) => b - a)[0] || 0;

export function freeFightOutfit(requirements: Requirement[] = []): void {
  const compiledRequirements = Requirement.merge([
    ...requirements,
    new Requirement(
      myFamiliar() === $familiar`Pocket Professor` ? ["Familiar Experience"] : ["Familiar Weight"],
      {
        bonusEquip: new Map([
          [$item`lucky gold ring`, 400],
          [$item`Mr. Cheeng's spectacles`, 250],
          [$item`pantogram pants`, get("_pantogramModifier").includes("Drops Items") ? 100 : 0],
          [$item`Mr. Screege's spectacles`, 180],
          ...pantsgiving(),
          ...cheeses(false),
        ]),
      }
    ),
  ]);
  const bjornAlike =
    have($item`Buddy Bjorn`) &&
    !(
      compiledRequirements.maximizeOptions_.forceEquip &&
      compiledRequirements.maximizeOptions_.forceEquip.some(
        (equipment) => toSlot(equipment) === $slot`back`
      )
    )
      ? $item`Buddy Bjorn`
      : $item`Crown of Thrones`;

  const bjornChoice =
    myFamiliar() === $familiar`Machine Elf`
      ? pickBjorn(PickBjornMode.DMT, bjornAlike)
      : pickBjorn(PickBjornMode.FREE, bjornAlike);

  const finalRequirements = compiledRequirements.merge(
    new Requirement([], {
      bonusEquip: new Map([
        [
          bjornAlike,
          !bjornChoice.hasDropsRemaining || bjornChoice.hasDropsRemaining()
            ? bjornChoice.meatVal() * bjornChoice.probability
            : 0,
        ],
      ]),
      preventEquip:
        bjornAlike === $item`Buddy Bjorn` ? $items`Crown of Thrones` : $items`Buddy Bjorn`,
    })
  );

  maximizeCached(finalRequirements.maximizeParameters(), finalRequirements.maximizeOptions());
  if (haveEquipped($item`Buddy Bjorn`)) bjornifyFamiliar(bjornChoice.familiar);
  if (haveEquipped($item`Crown of Thrones`)) enthroneFamiliar(bjornChoice.familiar);
}

export function meatOutfit(
  embezzlerUp: boolean,
  requirements: Requirement[] = [],
  sea?: boolean
): void {
  const forceEquip = [];
  const additionalRequirements = [];

  if (myInebriety() > inebrietyLimit()) {
    forceEquip.push($item`Drunkula's wineglass`);
  } else if (!embezzlerUp) {
    if (getKramcoWandererChance() > 0.05 && have($item`Kramco Sausage-o-Matic™`)) {
      forceEquip.push($item`Kramco Sausage-o-Matic™`);
    }
    // TODO: Fix pointer finger ring construction.
    if (myClass() !== $class`Seal Clubber`) {
      if (have($item`haiku katana`)) {
        forceEquip.push($item`haiku katana`);
      } else if (have($item`unwrapped knock-off retro superhero cape`)) {
        if (!have($item`ice nine`)) retrieveItem($item`ice nine`);
        forceEquip.push($item`ice nine`);
      }
    }
    if (
      have($item`protonic accelerator pack`) &&
      get("questPAGhost") === "unstarted" &&
      get("nextParanormalActivity") <= totalTurnsPlayed() &&
      !forceEquip.includes($item`ice nine`)
    ) {
      forceEquip.push($item`protonic accelerator pack`);
    }
    forceEquip.push($item`mafia pointer finger ring`);
  }
  if (myFamiliar() === $familiar`Obtuse Angel`) {
    forceEquip.push($item`quake of arrows`);
    if (!have($item`quake of arrows`)) retrieveItem($item`quake of arrows`);
  }
  if (sea) {
    additionalRequirements.push("sea");
  }

  const bjornAlike =
    have($item`Buddy Bjorn`) && !forceEquip.some((item) => toSlot(item) === $slot`back`)
      ? $item`Buddy Bjorn`
      : $item`Crown of Thrones`;
  const bjornChoice = pickBjorn(
    embezzlerUp ? PickBjornMode.EMBEZZLER : PickBjornMode.BARF,
    bjornAlike
  );
  const compiledRequirements = Requirement.merge([
    ...requirements,
    new Requirement(
      [
        `${((embezzlerUp ? baseMeat + 750 : baseMeat) / 100).toFixed(2)} Meat Drop`,
        `${embezzlerUp ? 0 : 0.72} Item Drop`,
        ...additionalRequirements,
      ],
      {
        forceEquip,
        preventEquip: [
          ...$items`broken champagne bottle, unwrapped knock-off retro superhero cape`,
          ...(embezzlerUp ? $items`cheap sunglasses` : []),
          bjornAlike === $item`Buddy Bjorn` ? $item`Crown of Thrones` : $item`Buddy Bjorn`,
        ],
        bonusEquip: new Map([
          [$item`lucky gold ring`, 400],
          [$item`mafia thumb ring`, 300],
          [$item`Mr. Cheeng's spectacles`, 250],
          [$item`pantogram pants`, get("_pantogramModifier").includes("Drops Items") ? 100 : 0],
          [$item`Mr. Screege's spectacles`, 180],
          ...(embezzlerUp ? [] : pantsgiving()),
          ...cheeses(embezzlerUp),
          [
            bjornAlike,
            !bjornChoice.hasDropsRemaining || bjornChoice.hasDropsRemaining()
              ? bjornChoice.meatVal() * bjornChoice.probability
              : 0,
          ],
        ]),
      }
    ),
  ]);

  maximizeCached(compiledRequirements.maximizeParameters(), compiledRequirements.maximizeOptions());

  if (equippedAmount($item`ice nine`) > 0) {
    equip($item`unwrapped knock-off retro superhero cape`);
  }
  if (haveEquipped($item`Buddy Bjorn`)) bjornifyFamiliar(bjornChoice.familiar);
  if (haveEquipped($item`Crown of Thrones`)) enthroneFamiliar(bjornChoice.familiar);
  if (sea) {
    if (!booleanModifier("Adventure Underwater")) {
      for (const airSource of waterBreathingEquipment) {
        if (have(airSource)) {
          if (airSource === $item`The Crown of Ed the Undying`) cliExecute("edpiece fish");
          equip(airSource);
          break;
        }
      }
    }
    if (!booleanModifier("Underwater Familiar")) {
      for (const airSource of familiarWaterBreathingEquipment) {
        if (have(airSource)) {
          equip(airSource);
          break;
        }
      }
    }
  }
}

export const waterBreathingEquipment = $items`The Crown of Ed the Undying, aerated diving helmet, crappy Mer-kin mask, Mer-kin gladiator mask, Mer-kin scholar mask, old SCUBA tank`;
export const familiarWaterBreathingEquipment = $items`das boot, little bitty bathysphere`;

function pantsgiving() {
  if (!have($item`Pantsgiving`)) return new Map<Item, number>();
  const count = get("_pantsgivingCount");
  const turnArray = [5, 50, 500, 5000];
  const index =
    myFullness() === fullnessLimit()
      ? get("_pantsgivingFullness")
      : turnArray.findIndex((x) => count < x);
  const turns = turnArray[index] || 50000;
  if (turns - count > estimatedTurns()) return new Map<Item, number>();
  const sinusVal = 50 * 1.0 * baseMeat; //if we add mayozapine support, fiddle with this
  const fullnessValue =
    sinusVal +
    get("valueOfAdventure") * 6.5 -
    (mallPrice($item`jumping horseradish`) + mallPrice($item`Special Seasoning`));
  return new Map<Item, number>([[$item`Pantsgiving`, fullnessValue / (turns * 0.9)]]);
}
const haveSomeCheese = getFoldGroup($item`stinky cheese diaper`).some((item) => have(item));
function cheeses(embezzlerUp: boolean) {
  return haveSomeCheese &&
    !globalOptions.ascending &&
    get("_stinkyCheeseCount") < 100 &&
    estimatedTurns() >= 100 - get("_stinkyCheeseCount") &&
    !embezzlerUp
    ? new Map<Item, number>(
        getFoldGroup($item`stinky cheese diaper`).map((item) => [
          item,
          get("valueOfAdventure") * (10 - bestAdventuresFromPants) * (1 / 100),
        ])
      )
    : [];
}
