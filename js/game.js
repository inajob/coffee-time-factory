// js/game.js
import { Miner, Furnace, ConveyorBelt, Item, Assembler } from './entities.js'; // Playerを削除
import { RECIPES } from './recipes.js'; // RECIPESをインポート

export class Game {
    constructor(gridWidth, gridHeight) {
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
        this.grid = this.createEmptyGrid();
        // this.player = new Player(Math.floor(gridWidth / 2), Math.floor(gridHeight / 2)); // Playerクラスのインスタンス化を削除
        this.time = 15 * 60; // 15 minutes in seconds
        this.inventory = {}; // { 'item_type': count }
        this.log = ["ゲーム開始！"];

        this.currentBuildingType = null; // 建設中の施設タイプ
        this.currentBuildingDirection = 'north'; // 建設中の施設の向き

        this.electronicCircuitCount = 0; // 電子基板の生産数を追跡
        this.goal = { type: 'electronic_circuit', targetCount: 10 }; // 新しい目標

        this.initializeResources(); // 資源を初期配置
    }

    createEmptyGrid() {
        const grid = [];
        for (let y = 0; y < this.gridHeight; y++) {
            const row = [];
            for (let x = 0; x < this.gridWidth; x++) {
                row.push({
                    type: 'ground', // 'ground', 'water', 'resource'
                    resource: null, // { type: 'iron_ore', amount: 1000 }
                    building: null, // Building object
                    items: [] // Items on conveyor belts (for rendering, actual items are in ConveyorBelt.items)
                });
            }
            grid.push(row);
        }
        return grid;
    }

    initializeResources() {
        // 鉄鉱石の配置
        this.grid[5][5].resource = { type: 'iron_ore', amount: 1000 };
        this.grid[5][6].resource = { type: 'iron_ore', amount: 1000 };
        this.grid[6][5].resource = { type: 'iron_ore', amount: 1000 };
        this.grid[6][6].resource = { type: 'iron_ore', amount: 1000 };

        // 銅鉱石の配置
        this.grid[8][15].resource = { type: 'copper_ore', amount: 800 };
        this.grid[9][15].resource = { type: 'copper_ore', amount: 800 };

        // 石炭の配置
        this.grid[12][3].resource = { type: 'coal', amount: 1200 };
        this.grid[12][4].resource = { type: 'coal', amount: 1200 };

        // crude_oil の配置は削除
    }

    update(deltaTime) {
        this.time = Math.max(0, this.time - deltaTime);

        // 各施設の更新
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const tile = this.grid[y][x];
                if (tile.building) {
                    tile.building.update(deltaTime, this);

                    // 施設からアイテムを排出するロジック (簡易版)
                    if (tile.building.outputInventory && tile.building.outputInventory.length > 0) {
                        const nextTile = this.getAdjacentTile(x, y, tile.building.direction);
                        if (nextTile && nextTile.building instanceof ConveyorBelt) {
                            const itemToMove = tile.building.outputInventory[0];
                            // コンベアに空きがあるか、または同じ種類のアイテムが流れていて合流可能か
                            if (nextTile.building.items.length < 2) { // 簡易的に2個までとする
                                nextTile.building.items.push(new Item(itemToMove.type, 0)); // コンベアの先頭に追加
                                tile.building.outputInventory.shift(); // 施設からアイテムを削除
                            }
                        }
                    }
                }
            }
        }

        // ベルトコンベア上のアイテム移動
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const tile = this.grid[y][x];
                if (tile.building instanceof ConveyorBelt) {
                    const conveyor = tile.building;
                    // アイテムを逆順に処理して、移動中にインデックスが変わるのを防ぐ
                    for (let i = conveyor.items.length - 1; i >= 0; i--) {
                        const item = conveyor.items[i];
                        item.position += conveyor.speed * deltaTime;

                        if (item.position >= 1.0) {
                            // アイテムがコンベアの終端に到達
                            const nextTile = this.getAdjacentTile(x, y, conveyor.direction);
                            if (nextTile) {
                                // 次のタイルがコンベアの場合
                                if (nextTile.building instanceof ConveyorBelt) {
                                    // 次のコンベアに空きがあるか、または詰まっていないか
                                    if (nextTile.building.items.length < 2) { // 簡易的に2個まで
                                        nextTile.building.items.push(new Item(item.type, 0)); // 次のコンベアの先頭に追加
                                        conveyor.items.splice(i, 1); // 現在のコンベアから削除
                                    } else {
                                        // 次のコンベアが詰まっている場合、現在のコンベアの終端で停止
                                        item.position = 0.99; // 終端で停止
                                    }
                                }
                                // 次のタイルが施設の場合 (簡易的に搬入)
                                else if (nextTile.building) {
                                    // かまどの場合、石炭は燃料インベントリへ、それ以外は入力インベントリへ
                                    if (nextTile.building instanceof Furnace && item.type === 'coal') {
                                        nextTile.building.fuelInventory.push(item); // 燃料インベントリへ
                                        conveyor.items.splice(i, 1); // 現在のコンベアから削除
                                    } else if (nextTile.building.inputInventory) {
                                        nextTile.building.inputInventory.push(item); // 入力インベントリへ
                                        conveyor.items.splice(i, 1); // 現在のコンベアから削除
                                    } else {
                                        // 搬入先がない場合、アイテムはコンベアの終端で停止
                                        item.position = 0.99;
                                    }
                                } else {
                                    // 次のタイルが何もない場合、アイテムはコンベアの終端で停止
                                    item.position = 0.99;
                                }
                            } else {
                                // マップ外の場合、アイテムはコンベアの終端で停止
                                item.position = 0.99;
                            }
                        }
                    }
                }
            }
        }

        // 最終目標の達成判定
        if (this.electronicCircuitCount >= this.goal.targetCount) {
            this.addLog(`ゲームクリア！ ${this.goal.type}を${this.goal.targetCount}個クラフトしました！`);
            // ゲームを停止するなどの処理
            // this.time = 0; // 時間を停止
        }
    }

    // movePlayer(dx, dy) メソッドを削除

    placeBuilding(x, y, type, direction) {
        if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) {
            this.addLog("マップの範囲外には建設できません。");
            return false;
        }
        if (this.grid[y][x].building !== null) {
            this.addLog("その場所にはすでに施設があります。");
            return false;
        }
        if (this.grid[y][x].resource !== null && type !== 'miner') {
            this.addLog("資源の上に施設を建設することはできません（採掘機を除く）。");
            return false;
        }

        let newBuilding = null;
        switch (type) {
            case 'miner':
                if (!this.grid[y][x].resource) {
                    this.addLog("採掘機は資源の上にのみ建設できます。");
                    return false;
                }
                newBuilding = new Miner(x, y, direction);
                break;
            case 'furnace':
                newBuilding = new Furnace(x, y, direction);
                // デフォルトレシピ設定を削除 (UIで設定するため)
                break;
            case 'conveyor':
                newBuilding = new ConveyorBelt(x, y, direction);
                break;
            case 'assembler': // Assemblerのケースを追加
                newBuilding = new Assembler(x, y, direction);
                // デフォルトレシピ設定を削除 (UIで設定するため)
                break;
            default:
                this.addLog("不明な施設タイプです。");
                return false;
        }

        this.grid[y][x].building = newBuilding;
        this.addLog(`${type}を(${x}, ${y})に建設しました。`);
        return true;
    }

    removeBuilding(x, y) {
        if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) return;
        if (this.grid[y][x].building) {
            const buildingType = this.grid[y][x].building.type;
            this.grid[y][x].building = null;
            this.addLog(`${buildingType}を(${x}, ${y})から撤去しました。`);
        }
    }

    rotateBuilding(x, y) {
        if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) return;
        if (this.grid[y][x].building) {
            this.grid[y][x].building.rotate();
            this.addLog(`${this.grid[y][x].building.type}を回転しました。`);
        }
    }

    getAdjacentTile(x, y, direction) {
        let targetX = x;
        let targetY = y;
        if (direction === 'north') targetY--;
        else if (direction === 'east') targetX++;
        else if (direction === 'south') targetY++;
        else if (direction === 'west') targetX--;

        if (targetX >= 0 && targetX < this.gridWidth && targetY >= 0 && targetY < this.gridHeight) {
            return this.grid[targetY][targetX];
        }
        return null;
    }

    addLog(message) {
        this.log.push(message);
        if (this.log.length > 10) { // ログの表示数を制限
            this.log.shift();
        }
    }

    // 施設のレシピを設定する汎用メソッド
    setBuildingRecipe(x, y, recipe) {
        const building = this.grid[y][x].building;
        if (building instanceof Furnace || building instanceof Assembler) { // Furnaceにも対応
            building.currentRecipe = recipe;
            building.craftingSpeed = recipe.crafting_time; // レシピにクラフト時間を持たせる
            this.addLog(`${building.type}(${x}, ${y})にレシピ「${recipe.name}」を設定しました。`);
            return true;
        }
        return false;
    }

    // インベントリにアイテムを追加するヘルパーメソッド
    addItemToInventory(itemType, count = 1) {
        if (this.inventory[itemType]) {
            this.inventory[itemType] += count;
        } else {
            this.inventory[itemType] = count;
        }
        this.addLog(`${itemType}を${count}個インベントリに追加しました。`);
    }
}