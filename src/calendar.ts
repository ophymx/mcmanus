import * as mineflayer from 'mineflayer';

/**
 * Phases of the moon.
 */
const MOON_PHASES = [
  'Full Moon',
  'Waning Gibbous',
  'Third Quarter',
  'Waning Crescent',
  'New Moon',
  'Waxing Crescent',
  'First Quarter',
  'Waxing Gibbous',
]

/**
 * Name of the days of the week / lunar month.
 */
const MOON_DAYS = [
  'Fullday',
  '1day',  // TBD name
  'Thirday',
  '3day',  // TBD name
  'Newday',
  '5day',  // TBD name
  'Quarterday',
  '7day',  // TBD name
]

/**
 * Name of the months.
 */
const MONTHS = [
  'Ogrilian',  // Origin
  'Arburary',  // Tree
  'Lapisary',  // Stone
  'Ferrimus',  // Iron
  'Aurumgus',  // Gold
  'Adamanta',  // Diamond
  'Nethember', // Nether
  'Finisber',  // End
]

const DAYS_IN_WEEK = MOON_PHASES.length;
const WEEKS_IN_MONTH = 4;
const MONTHS_IN_YEAR = 8;
const DAYS_IN_MONTH = DAYS_IN_WEEK * WEEKS_IN_MONTH;
const WEEKS_IN_YEAR = WEEKS_IN_MONTH * MONTHS_IN_YEAR;
const DAYS_IN_YEAR = DAYS_IN_MONTH * MONTHS_IN_YEAR;

// Number of ticks to add to get to high noon.
const NOON_OFFSET = 7000

const TICKS_PER_DAY = 24000;
const TICKS_PER_HOUR = TICKS_PER_DAY / 24;
const TICKS_PER_MINUTE = TICKS_PER_HOUR / 60;
const TICKS_PER_SECOND = TICKS_PER_MINUTE / 60;

interface Festival {
  name?: string
  date: [number, number]
}

const FESTIVALS: { [key: string]: Festival; } = {
  'Origin Day': { date: [0, 0] },
  'Grand Arbourus': { date: [1, 20] },
}

function genFestivalsLookup(): Map<number, Festival> {
  let lookup = new Map<number, Festival>();
  for (const name in FESTIVALS) {
    let festival = FESTIVALS[name];
    festival.name = name;
    const date = festival.date
    lookup.set(date[0] * DAYS_IN_MONTH + date[1], festival);
  }
  return lookup;
}

const FESTIVALS_LOOKUP = genFestivalsLookup();

function zp(value: number): string {
  if (value < 10) {
    return "0" + value;
  }
  return value.toString()
}

export class Datetime {
  tick: number
  year: number
  month: number
  dayOfMonth: number
  dayOfWeek: number
  hour: number
  minute: number
  second: number

  constructor(time: mineflayer.Time) {
    this.tick = time.time
    const dateTick = this.tick + NOON_OFFSET;
    const day = Math.floor(dateTick / TICKS_PER_DAY);
    const timeOfDay = dateTick % TICKS_PER_DAY;
    this.year = Math.floor(day / DAYS_IN_YEAR);
    this.month = Math.floor(day / DAYS_IN_MONTH) % MONTHS_IN_YEAR;
    this.dayOfMonth = day % DAYS_IN_MONTH;
    this.dayOfWeek = day % DAYS_IN_WEEK;
    this.hour = Math.floor(timeOfDay / TICKS_PER_HOUR);
    this.minute = Math.floor(timeOfDay / TICKS_PER_MINUTE) % 60;
    this.second = Math.floor(timeOfDay / TICKS_PER_SECOND);
  }

  public toString(): string {
    return zp(this.year) + '/' + zp(this.month) + '/' + zp(this.dayOfMonth) +
      ' ' + zp(this.hour) + ':' + zp(this.minute) + ':' + zp(this.second);
  }
}
