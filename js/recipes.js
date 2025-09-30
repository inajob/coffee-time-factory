// js/recipes.js

export const RECIPES = {
    furnace: [
        {
            name: "鉄板",
            input: [{ type: 'iron_ore', amount: 1 }], // coalを削除
            output: [{ type: 'iron_plate', amount: 1 }],
            fuel: [{ type: 'coal', amount: 1 }], // fuelプロパティを追加
            crafting_time: 1
        },
        {
            name: "銅板",
            input: [{ type: 'copper_ore', amount: 1 }], // coalを削除
            output: [{ type: 'copper_plate', amount: 1 }],
            fuel: [{ type: 'coal', amount: 1 }], // fuelプロパティを追加
            crafting_time: 1
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
            name: "電子基板",
            input: [{ type: 'iron_plate', amount: 1 }, { type: 'copper_wire', amount: 3 }],
            output: [{ type: 'electronic_circuit', amount: 1 }],
            crafting_time: 1
        }
        // 他の組立機レシピもここに追加
    ]
};