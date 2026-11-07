import * as migration_20261029_141446_phase3_baseline from './20261029_141446_phase3_baseline'
import * as migration_20261029_141553_phase4_portfolio from './20261029_141553_phase4_portfolio'
import * as migration_20261029_145751_phase5_showroom from './20261029_145751_phase5_showroom'
import * as migration_20261029_153957_phase6_contact from './20261029_153957_phase6_contact'
import * as migration_20261029_160902_phase7_corporate_catalog from './20261029_160902_phase7_corporate_catalog'
import * as migration_20261031_203910_phase8_furniture_configurator from './20261031_203910_phase8_furniture_configurator'
import * as migration_20261105_093608_phase9_10_assistant_consent from './20261105_093608_phase9_10_assistant_consent'
import * as migration_20261105_215849_phase8_3_design_quote from './20261105_215849_phase8_3_design_quote'
import * as migration_20261107_144050_vercel_blob_media from './20261107_144050_vercel_blob_media'

export const migrations = [
  {
    up: migration_20261029_141446_phase3_baseline.up,
    down: migration_20261029_141446_phase3_baseline.down,
    name: '20261029_141446_phase3_baseline',
  },
  {
    up: migration_20261029_141553_phase4_portfolio.up,
    down: migration_20261029_141553_phase4_portfolio.down,
    name: '20261029_141553_phase4_portfolio',
  },
  {
    up: migration_20261029_145751_phase5_showroom.up,
    down: migration_20261029_145751_phase5_showroom.down,
    name: '20261029_145751_phase5_showroom',
  },
  {
    up: migration_20261029_153957_phase6_contact.up,
    down: migration_20261029_153957_phase6_contact.down,
    name: '20261029_153957_phase6_contact',
  },
  {
    up: migration_20261029_160902_phase7_corporate_catalog.up,
    down: migration_20261029_160902_phase7_corporate_catalog.down,
    name: '20261029_160902_phase7_corporate_catalog',
  },
  {
    up: migration_20261031_203910_phase8_furniture_configurator.up,
    down: migration_20261031_203910_phase8_furniture_configurator.down,
    name: '20261031_203910_phase8_furniture_configurator',
  },
  {
    up: migration_20261105_093608_phase9_10_assistant_consent.up,
    down: migration_20261105_093608_phase9_10_assistant_consent.down,
    name: '20261105_093608_phase9_10_assistant_consent',
  },
  {
    up: migration_20261105_215849_phase8_3_design_quote.up,
    down: migration_20261105_215849_phase8_3_design_quote.down,
    name: '20261105_215849_phase8_3_design_quote',
  },
  {
    up: migration_20261107_144050_vercel_blob_media.up,
    down: migration_20261107_144050_vercel_blob_media.down,
    name: '20261107_144050_vercel_blob_media',
  },
]
