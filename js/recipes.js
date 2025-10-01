import { getItemColor } from './utils.js';
import { getJapaneseBuildingType } from './main.js';

// js/recipes.js

export const RECIPES = {
    furnace: [
        {
            name: "鉄板",
            input: [{ type: 'iron_ore', amount: 1 }, { type: 'coal', amount: 1 }],
            output: [{ type: 'iron_plate', amount: 1 }],
            crafting_time: 1
        },
        {
            name: "銅板",
            input: [{ type: 'copper_ore', amount: 1 }, { type: 'coal', amount: 1 }],
            output: [{ type: 'copper_plate', amount: 1 }],
            crafting_time: 1
        },
        {
            name: "ガラス",
            input: [{ type: 'quartz_ore', amount: 2 }, { type: 'coal', amount: 2 }], // 材料の石炭を1個から2個に調整
            output: [{ type: 'glass', amount: 1 }],
            crafting_time: 1.5
        },
        {
            name: "プラスチック",
            input: [{ type: 'coal', amount: 4 }], // 材料の石炭を3個から4個に調整
            output: [{ type: 'plastic', amount: 1 }],
            crafting_time: 2
        }
    ],
    assembler: [
        {
            name: "銅線",
            input: [{ type: 'copper_plate', amount: 1 }],
            output: [{ type: 'copper_wire', amount: 2 }],
            crafting_time: 0.5
        },
        {
            name: "歯車",
            input: [{ type: 'iron_plate', amount: 2 }],
            output: [{ type: 'gear', amount: 1 }],
            crafting_time: 0.5
        },
        {
            name: "電子基板",
            input: [{ type: 'iron_plate', amount: 1 }, { type: 'copper_wire', amount: 3 }],
            output: [{ type: 'electronic_circuit', amount: 1 }],
            crafting_time: 1
        },
        {
            name: "高度プロセッサ",
            input: [{ type: 'electronic_circuit', amount: 2 }, { type: 'glass', amount: 1 }, { type: 'plastic', amount: 1 }],
            output: [{ type: 'advanced_processor', amount: 1 }],
            crafting_time: 3
        },
        {
            name: "ロボットアーム",
            input: [{ type: 'advanced_processor', amount: 1 }, { type: 'gear', amount: 3 }, { type: 'iron_plate', amount: 5 }],
            output: [{ type: 'robot_arm', amount: 1 }],
            crafting_time: 4
        }
    ]
};

export const BUILDING_COSTS = {
    miner: [{ type: 'iron_plate', amount: 2 }, { type: 'copper_plate', amount: 1 }],
    furnace: [{ type: 'iron_plate', amount: 2 }, { type: 'copper_plate', amount: 1 }],
    conveyor: [{ type: 'iron_plate', amount: 1 }],
    assembler: [{ type: 'iron_plate', amount: 5 }],
    storage_chest: [{ type: 'iron_plate', amount: 2 }, { type: 'plastic', amount: 1 }],
    splitter: [{ type: 'iron_plate', amount: 3 }, { type: 'copper_plate', amount: 1 }]
};

// レシピ情報を整形して返すヘルパーメソッド
export function getFormattedRecipes(getItemJapaneseName) {
    let formattedText = '';

    formattedText += '<div class="cheat-sheet-category">--- かまど (Furnace) レシピ ---</div>';
    RECIPES.furnace.forEach(recipe => {
        const input = recipe.input.map(i => `${getItemJapaneseName(i.type)} <span style="background-color: ${getItemColor(i.type)};" class="item-color-icon"></span>x${i.amount}`).join(' + ');
        const output = recipe.output.map(o => `${getItemJapaneseName(o.type)} <span style="background-color: ${getItemColor(o.type)};" class="item-color-icon"></span>x${o.amount}`).join(' + ');
        formattedText += `<div class="cheat-sheet-recipe">${input} → ${output} (時間: ${recipe.crafting_time}秒)</div>`;
    });

    formattedText += '<div class="cheat-sheet-category">--- 組立機 (Assembler) レシピ ---</div>';
    RECIPES.assembler.forEach(recipe => {
        const input = recipe.input.map(i => `${getItemJapaneseName(i.type)} <span style="background-color: ${getItemColor(i.type)};" class="item-color-icon"></span>x${i.amount}`).join(' + ');
        const output = recipe.output.map(o => `${getItemJapaneseName(o.type)} <span style="background-color: ${getItemColor(o.type)};" class="item-color-icon"></span>x${o.amount}`).join(' + ');
        formattedText += `<div class="cheat-sheet-recipe">${input} → ${output} (時間: ${recipe.crafting_time}秒)</div>`;
    });

    formattedText += '<div class="cheat-sheet-category">--- 施設クラフトコスト ---</div>';
    for (const buildingType in BUILDING_COSTS) {
        const costs = BUILDING_COSTS[buildingType].map(c => `${getItemJapaneseName(c.type)} <span style="background-color: ${getItemColor(c.type)};" class="item-color-icon"></span>x${c.amount}`).join(' + ');
        formattedText += `<div class="cheat-sheet-recipe">${getJapaneseBuildingType(buildingType)}: ${costs}</div>`;
    }

    return formattedText;
}