/* eslint-disable @typescript-eslint/indent */
import path from "node:path";
import { DependencyContainer } from "tsyringe";

import { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import { DatabaseServer } from "@spt/servers/DatabaseServer";
import { ConfigServer } from "@spt/servers/ConfigServer";
import { ConfigTypes } from "@spt/models/enums/ConfigTypes";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { IHideoutConfig } from "@spt/models/spt/config/IHideoutConfig";

import { IDatabaseTables } from "@spt/models/spt/server/IDatabaseTables";

import { VFS } from "@spt/utils/VFS";

import { jsonc } from "jsonc";

class Mod implements IPostDBLoadMod {
  public postDBLoad(container: DependencyContainer): void {
    const vfs = container.resolve<VFS>("VFS");
    const config = jsonc.parse(
      vfs.readFile(path.resolve(__dirname, "../config/config.jsonc"))
    );
    const databaseServer = container.resolve<DatabaseServer>("DatabaseServer");
    const configServer = container.resolve<ConfigServer>("ConfigServer");
    const tables: IDatabaseTables = databaseServer.getTables();

    const hideoutConfig = configServer.getConfig<IHideoutConfig>(
      ConfigTypes.HIDEOUT
    );

    if (config.HideoutOptions.enabled) {
      // 10x Faster hideout production, 2x superwater and moonshine production, bitcoins
      for (const prod in tables.hideout.production) {
        const endProduct = tables.hideout.production[prod].endProduct;
        const productionTime = tables.hideout.production[prod].productionTime;
        if (
          (endProduct == "5d1b376e86f774252519444e" ||
            endProduct == "5d1b33a686f7742523398398") &&
          config.HideoutOptions.Faster_Moonshine_and_Purified_Water_Production
            .enabled
        ) {
          // superwater and moonshine
          tables.hideout.production[prod].productionTime = Math.round(
            productionTime /
              config.HideoutOptions
                .Faster_Moonshine_and_Purified_Water_Production
                .Base_Moonshine_And_Water_Time_Multiplier
          );
        } else if (
          endProduct == "59faff1d86f7746c51718c9c" &&
          config.HideoutOptions.Faster_Bitcoin_Farming.enabled == true
        ) {
          // bitcoins
          tables.hideout.production[prod].productionTime = Math.round(
            productionTime /
              config.HideoutOptions.Faster_Bitcoin_Farming
                .Base_Bitcoin_Time_Multiplier
          );
          if (
            config.HideoutOptions.Faster_Bitcoin_Farming
              .Revert_Bitcoin_Price_To_v012 == true
          ) {
            tables.templates.handbook.Items.find(
              (x) => x.Id == "59faff1d86f7746c51718c9c"
            ).Price = 100000;
          }
        } else if (config.HideoutOptions.Faster_Crafting_Time.enabled) {
          // all other crafts
          tables.hideout.production[prod].productionTime =
            Math.round(
              productionTime /
                config.HideoutOptions.Faster_Crafting_Time
                  .Base_Crafting_Time_Multiplier
            ) + 1;
        }
      }

      if (
        config.HideoutOptions.Faster_Crafting_Time.enabled &&
        config.HideoutOptions.Faster_Crafting_Time.Hideout_Skill_Exp_Fix.enabled
      ) {
        // Buff to hideout exp rate, more testing needed
        hideoutConfig.hoursForSkillCrafting /=
          config.HideoutOptions.Faster_Crafting_Time.Hideout_Skill_Exp_Fix.Hideout_Skill_Exp_Multiplier;
      }

      if (config.HideoutOptions.Faster_Bitcoin_Farming.enabled) {
        // Instead of modifing base farming time try this:
        tables.hideout.settings.gpuBoostRate =
          config.HideoutOptions.Faster_Bitcoin_Farming.GPU_Efficiency;
      }

      if (config.HideoutOptions.Faster_Hideout_Construction.enabled) {
        // 10x Faster hideout construction
        for (const area in tables.hideout.areas) {
          for (const stage in tables.hideout.areas[area].stages) {
            tables.hideout.areas[area].stages[stage].constructionTime =
              Math.round(
                tables.hideout.areas[area].stages[stage].constructionTime /
                  config.HideoutOptions.Faster_Hideout_Construction
                    .Hideout_Construction_Time_Multiplier
              );
          }
        }
      }

      if (config.HideoutOptions.Increased_Fuel_Consumption.enabled) {
        // 10x faster fuel draw
        tables.hideout.settings.generatorFuelFlowRate *=
          config.HideoutOptions.Increased_Fuel_Consumption.Fuel_Consumption_Multiplier;
      }
    }
  }
}

export const mod = new Mod();
