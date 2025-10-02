// js/game.js
import { Miner, Furnace, ConveyorBelt, Item, Assembler, StorageChest, Splitter, ShippingTerminal } from './entities.js';
import { RECIPES, BUILDING_COSTS } from './recipes.js'; // RECIPESとBUILDING_COSTSをインポート

export class Game {
    constructor(gridWidth, gridHeight) {
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
        this.grid = this.createEmptyGrid();
        // this.player = new Player(Math.floor(gridWidth / 2), Math.floor(gridHeight / 2)); // Playerクラスのインスタンス化を削除
        this.time = 0; // 0からカウントアップ
        this.inventory = {}; // { 'item_type': count }
        this.log = ["ゲーム開始！"];

        this.currentBuildingType = null; // 建設中の施設タイプ
        this.currentBuildingDirection = 'north'; // 建設中の施設の向き

        this.goalItemCount = 0; // 最終目標アイテムの生産数を追跡
        this.goal = { type: 'robot', targetCount: 10 }; // 新しい目標
        this.isGameOver = false; // ゲームオーバーフラグを追加
        this.playerInventoryItemCapacity = 100; // プレイヤーインベントリの各アイテムの容量

        this.robotProductionCount = 0; // ロボットの総生産数
        this.lastRobotProductionTime = 0; // 最後のロボット生産時刻
        this.robotProductionRate = 0; // 単位時間あたりのロボット生産個数
        this.totalRobotsShipped = 0; // 出荷されたロボットの総数
        this.allConveyorItems = []; // すべてのコンベア上のアイテムを保持

        this.initializeResources(); // 資源を初期配置

        // 初期インベントリ
        this.addItemToInventory('iron_plate', 30);
        this.addItemToInventory('copper_plate', 15);
        this.addItemToInventory('plastic', 2);
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
        this.grid[5][5].resource = { type: 'iron_ore' };
        this.grid[5][6].resource = { type: 'iron_ore' };
        this.grid[6][5].resource = { type: 'iron_ore' };
        this.grid[6][6].resource = { type: 'iron_ore' };

        // 銅鉱石の配置
        this.grid[8][15].resource = { type: 'copper_ore' };
        this.grid[9][15].resource = { type: 'copper_ore' };

        // 石炭の配置
        this.grid[12][3].resource = { type: 'coal' };
        this.grid[12][4].resource = { type: 'coal' };
        this.grid[13][3].resource = { type: 'coal' }; // 追加
        this.grid[13][4].resource = { type: 'coal' }; // 追加

        // 石英鉱石の配置
        this.grid[2][10].resource = { type: 'quartz_ore' };
        this.grid[2][11].resource = { type: 'quartz_ore' };
    }

    update(deltaTime) {
        this.time += deltaTime; // カウントアップに変更
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const tile = this.grid[y][x];
                if (tile.building) {
                    tile.building.update(deltaTime, this);

                    // Miner, Furnace, Assemblerからの排出
                    if (tile.building.outputInventory && tile.building.outputInventory.length > 0) {
                        const nextTile = this.getAdjacentTile(x, y, tile.building.direction);
                        if (nextTile && nextTile.building instanceof ConveyorBelt) {
                            const itemToMove = tile.building.outputInventory[0];
                            if (nextTile.building.items.length < 2) { // 簡易的に2個までとする
                                const newItem = new Item(itemToMove.type, 0, tile.building.direction); // previousConveyorDirectionを設定
                                nextTile.building.items.push(newItem); // コンベアの先頭に追加
                                tile.building.outputInventory.shift(); // 施設からアイテムを削除
                            }
                        }
                    }
                    // Splitterからの排出
                    if (tile.building instanceof Splitter) {
                        // outputInventory1からの排出
                        if (tile.building.outputInventory1.length > 0) {
                            // Splitterの向きに応じてoutput1の排出方向を決定
                            const output1Direction = this._getSplitterOutputDirection(tile.building.direction, 1);
                            const nextTile = this.getAdjacentTile(x, y, output1Direction);
                            if (nextTile && nextTile.building instanceof ConveyorBelt) {
                                const itemToMove = tile.building.outputInventory1[0];
                                if (nextTile.building.items.length < 2) {
                                    // newItemのpreviousConveyorDirectionにoutput1Directionを設定
                                    nextTile.building.items.push(new Item(itemToMove.type, 0, output1Direction)); // <-- ここを修正
                                    tile.building.outputInventory1.shift();
                                }
                            }
                        }
                        // outputInventory2からの排出
                        if (tile.building.outputInventory2.length > 0) {
                            // Splitterの向きに応じてoutput2の排出方向を決定
                            const output2Direction = this._getSplitterOutputDirection(tile.building.direction, 2);
                            const nextTile = this.getAdjacentTile(x, y, output2Direction);
                            if (nextTile && nextTile.building instanceof ConveyorBelt) {
                                const itemToMove = tile.building.outputInventory2[0];
                                if (nextTile.building.items.length < 2) {
                                    // newItemのpreviousConveyorDirectionにoutput2Directionを設定
                                    nextTile.building.items.push(new Item(itemToMove.type, 0, output2Direction)); // <-- ここを修正
                                    tile.building.outputInventory2.shift();
                                }
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
                                        if (nextTile.building.items.length < 2) { // 簡易的に2個までとする
                                            // 超過分を次のコンベアのpositionに引き継ぐ
                                            const newPosition = item.position - 1.0;
                                            const newItem = new Item(item.type, newPosition, conveyor.direction); // previousConveyorDirectionを設定
                                            nextTile.building.items.push(newItem);
                                            conveyor.items.splice(i, 1); // 現在のコンベアから削除
                                    } else {
                                        // 次のコンベアが詰まっている場合、現在のコンベアの終端で停止
                                        item.position = 0.99; // 終端で停止
                                    }
                                } else if (nextTile.building) { // 次のタイルが施設の場合
                                    if (this._tryAddItemToBuildingInput(nextTile.building, item)) {
                                        conveyor.items.splice(i, 1); // 現在のコンベアから削除
                                    } else {
                                        item.position = 0.99; // 施設が満杯で追加できなかった場合、コンベアの終端で停止
                                    }
                                } else {
                                    // マップ外の場合、アイテムはコンベアの終端で停止
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
        if (this.inventory[this.goal.type] && this.inventory[this.goal.type] >= this.goal.targetCount && !this.isGameOver) {
            this.addLog(`ゲームクリア！ ${this.goal.type}を${this.goal.targetCount}個インベントリに入れました！`);
            this.isGameOver = true; // ゲームクリア状態を記録するが、ゲームは停止しない
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

        // 建設コストのチェックと消費
        const costs = BUILDING_COSTS[type];
        if (costs) {
            let canBuild = true;
            const missingItems = [];
            for (const cost of costs) {
                if ((this.inventory[cost.type] || 0) < cost.amount) {
                    canBuild = false;
                    missingItems.push(`${cost.type} x ${cost.amount - (this.inventory[cost.type] || 0)}`);
                }
            }

            if (!canBuild) {
                this.addLog(`建設に必要な素材が足りません: ${missingItems.join(', ')}`);
                return false;
            }

            // 素材を消費
            for (const cost of costs) {
                this.inventory[cost.type] -= cost.amount;
            }
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
            case 'storage_chest': // StorageChestのケースを追加
                newBuilding = new StorageChest(x, y);
                break;
            case 'splitter': // Splitterのケースを追加
                newBuilding = new Splitter(x, y, direction);
                break;
            case 'shipping_terminal': // ShippingTerminalのケースを追加
                newBuilding = new ShippingTerminal(x, y, direction);
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

    // スプリッターの出力方向を決定するヘルパーメソッド
    _getSplitterOutputDirection(splitterDirection, outputPort) {
        const directions = ['north', 'east', 'south', 'west'];
        const currentIndex = directions.indexOf(splitterDirection);

        if (outputPort === 1) { // 左側出力
            return directions[(currentIndex + 3) % 4]; // 反時計回りに90度
        } else { // outputPort === 2 (右側出力)
            return directions[(currentIndex + 1) % 4]; // 時計回りに90度
        }
    }

    // インベントリにアイテムを追加するヘルパーメソッド
    addItemToInventory(itemType, count = 1) {
        if (!this.inventory[itemType]) {
            this.inventory[itemType] = 0;
        }

        if (this.inventory[itemType] + count > this.playerInventoryItemCapacity) {
            this.addLog(`${itemType}のインベントリが満杯です。${itemType}を${count}個追加できませんでした。`);
            return false;
        }

        this.inventory[itemType] += count;
        this.addLog(`${itemType}を${count}個インベントリに追加しました。`);
        return true;
    }

    // 施設からアイテムを回収するメソッド
    collectItemsFromBuilding(x, y) {
        if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) return;
        const building = this.grid[y][x].building;

        if (!building) {
            this.addLog("その場所には施設がありません。");
            return;
        }

        let collectedCount = 0;
        let collectedItemType = '';

        // Miner, Furnace, Assembler, StorageChestからアイテムを回収
        if (building.outputInventory && building.outputInventory.length > 0) {
            while (building.outputInventory.length > 0) {
                const item = building.outputInventory.shift();
                this.addItemToInventory(item.type, 1);
                collectedItemType = item.type;
                collectedCount++;
            }
        } else if (building.inputInventory) { // inputInventoryが存在する場合
            if (building.inputInventory instanceof Map) { // Furnace, Assemblerの場合
                if (building.inputInventory.size > 0) {
                    for (const [type, count] of building.inputInventory) {
                        for (let i = 0; i < count; i++) {
                            if (this.addItemToInventory(type, 1)) { // 容量チェック
                                collectedItemType = type;
                                collectedCount++;
                            } else {
                                // インベントリが満杯で追加できなかった場合、ループを抜ける
                                break;
                            }
                        }
                        if (collectedCount > 0) { // 一部でも回収できたらクリア
                            building.inputInventory.delete(type);
                        }
                    }
                }
            } else if (building.inputInventory.length > 0) { // StorageChestの場合 (配列)
                while (building.inputInventory.length > 0) {
                    const item = building.inputInventory[0]; // shiftせずにチェック
                    if (this.addItemToInventory(item.type, 1)) { // 容量チェック
                        building.inputInventory.shift();
                        collectedItemType = item.type;
                        collectedCount++;
                    } else {
                        // インベントリが満杯で追加できなかった場合、ループを抜ける
                        break;
                    }
                }
            }
        }

        if (collectedCount > 0) {
            this.addLog(`${collectedItemType}を${collectedCount}個、${building.type}から回収しました。`);
        } else {
            this.addLog(`${building.type}には回収できるアイテムがありません。`);
        }
    }

    mineResource(x, y) {
        if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) return;
        const tile = this.grid[y][x];
        if (tile.resource) {
            const minedItemType = tile.resource.type;
            this.addItemToInventory(minedItemType, 1);
            this.addLog(`${minedItemType}を1個手動で採掘しました。`);
        }
    }

    // タイルの情報を取得するメソッド
    getTileInfo(x, y) {
        if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) {
            return null;
        }
        const tile = this.grid[y][x];
        return {
            x: x,
            y: y,
            type: tile.type,
            resource: tile.resource,
            building: tile.building
        };
    }

    // 施設へのアイテム搬入を試みる汎用メソッド
    _tryAddItemToBuildingInput(building, item) {
        if (!building.inputInventory) return false; // inputInventoryがない施設

        if (building.inputInventory instanceof Map) { // Mapで管理するインベントリ (Furnace, Assembler)
            const currentAmount = building.inputInventory.get(item.type) || 0;
            if (currentAmount < building.inputInventoryCapacity) {
                building.inputInventory.set(item.type, currentAmount + 1);
                return true;
            }
        } else { // 配列で管理するインベントリ (StorageChest, Splitter, ShippingTerminal)
            if (building.inputInventory.length < building.inputInventoryCapacity) {
                // ShippingTerminalの場合、robot以外は受け入れない
                if (building instanceof ShippingTerminal && item.type !== 'robot') {
                    return false;
                }
                building.inputInventory.push(item);
                return true;
            }
        }
        return false;
    }
}