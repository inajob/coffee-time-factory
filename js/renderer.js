// js/renderer.js
import { Splitter, ShippingTerminal, ConveyorBelt } from './entities.js';
import { getItemColor } from './utils.js';
export class Renderer {
    constructor(canvas, game, tileSize) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.tileSize = tileSize;
        this.game = game; // gameオブジェクトを保持

        // Canvasのサイズを設定
        this.canvas.width = tileSize * game.gridWidth;
        this.canvas.height = tileSize * game.gridHeight;
    }

    draw(game) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 1. 地面とグリッド線の描画
        for (let y = 0; y < game.gridHeight; y++) {
            for (let x = 0; x < game.gridWidth; x++) {
                const tile = game.grid[y][x];
                this.ctx.fillStyle = '#444'; // 地面の色
                if (tile.type === 'water') {
                    this.ctx.fillStyle = '#2a4d69'; // 水の色
                } else if (tile.resource) { // 資源があるタイルの地面の色を少し変える
                    this.ctx.fillStyle = '#6b4e3e';
                }
                this.ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);

                // グリッド線
                this.ctx.strokeStyle = '#555';
                this.ctx.strokeRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
            }
        }

        // 2. 施設の描画
        for (let y = 0; y < game.gridHeight; y++) {
            for (let x = 0; x < game.gridWidth; x++) {
                const tile = game.grid[y][x];
                if (tile.building) {
                    tile.building.draw(this.ctx, this.tileSize);
                }
            }
        }

        // 3. 資源の描画 (施設の上に描画)
        for (let y = 0; y < game.gridHeight; y++) {
            for (let x = 0; x < game.gridWidth; x++) {
                const tile = game.grid[y][x];
                if (tile.resource) {
                    this.ctx.fillStyle = getItemColor(tile.resource.type);
                    this.ctx.beginPath();
                    this.ctx.arc(x * this.tileSize + this.tileSize / 2, y * this.tileSize + this.tileSize / 2, this.tileSize / 8, 0, Math.PI * 2); // 半径を tileSize / 8 に変更
                    this.ctx.fill();
                    // 資源の残量表示 (デバッグ用) は削除
                }
            }
        }

        // プレイヤーの描画は削除
        // game.player.draw(this.ctx, this.tileSize);

        // UI情報の更新 (DOM操作)
        document.getElementById('time-display').textContent = `時間: ${Math.floor(game.time / 60).toString().padStart(2, '0')}:${Math.floor(game.time % 60).toString().padStart(2, '0')}`;
        const goalDisplay = document.getElementById('goal-display');
        if (game.isGameOver) {
            goalDisplay.textContent = `ロボット生産レート: ${game.robotProductionRate.toFixed(2)}個/秒`;
        } else {
            goalDisplay.textContent = `目標: ${game.goal.type}を${game.goal.targetCount}個インベントリに入れる (${game.goalItemCount}/${game.goal.targetCount})`;
        }
        document.getElementById('shipped-robots-display').textContent = `出荷ロボット数: ${game.totalRobotsShipped}`;
        document.getElementById('log-display').innerHTML = game.log.slice().reverse().map(msg => `<div>${msg}</div>`).join('');

        // インベントリ表示
        const inventoryDisplay = document.getElementById('inventory-display');
        let inventoryHtml = 'インベントリ:<br>';
        for (const itemType in game.inventory) {
            if (game.inventory[itemType] > 0) { // 0個のアイテムは表示しない
                inventoryHtml += `<div>${this._getItemJapaneseName(itemType)}: ${game.inventory[itemType]}</div>`;
            }
        }
        inventoryDisplay.innerHTML = inventoryHtml;

        // 4. ベルトコンベア上のアイテムの描画
        for (let y = 0; y < game.gridHeight; y++) {
            for (let x = 0; x < game.gridWidth; x++) {
                const tile = game.grid[y][x];
                if (tile.building instanceof ConveyorBelt) {
                    const conveyor = tile.building;
                    conveyor.items.forEach(item => {
                        const itemX = conveyor.x * this.tileSize;
                        const itemY = conveyor.y * this.tileSize;
                        const itemSize = this.tileSize / 2;

                        let drawX = itemX;
                        let drawY = itemY;

                        // アイテムの相対位置に基づいて描画位置を調整
                        if (conveyor.direction === 'north') {
                            drawY = itemY + this.tileSize - (item.position * this.tileSize) - itemSize / 2;
                            drawX = itemX + this.tileSize / 2 - itemSize / 2;
                        } else if (conveyor.direction === 'east') {
                            drawX = itemX + (item.position * this.tileSize) - itemSize / 2;
                            drawY = itemY + this.tileSize / 2 - itemSize / 2;
                        } else if (conveyor.direction === 'south') {
                            drawY = itemY + (item.position * this.tileSize) - itemSize / 2;
                            drawX = itemX + this.tileSize / 2 - itemSize / 2;
                        } else if (conveyor.direction === 'west') {
                            drawX = itemX + this.tileSize - (item.position * this.tileSize) - itemSize / 2;
                            drawY = itemY + this.tileSize / 2 - itemSize / 2;
                        }

                        this.ctx.fillStyle = getItemColor(item.type);
                        this.ctx.fillRect(drawX, drawY, itemSize, itemSize);
                    });
                }
            }
        }
    }

    _getItemJapaneseName(itemType) {
        switch (itemType) {
            case 'iron_ore': return '鉄鉱石';
            case 'copper_ore': return '銅鉱石';
            case 'coal': return '石炭';
            case 'quartz_ore': return '石英鉱石';
            case 'iron_plate': return '鉄板';
            case 'copper_plate': return '銅板';
            case 'copper_wire': return '銅線';
            case 'gear': return '歯車';
            case 'glass': return 'ガラス';
            case 'plastic': return 'プラスチック';
            case 'electronic_circuit': return '電子基板';
            case 'advanced_processor': return '高度プロセッサ';
            case 'robot_body': return 'ロボットボディ';
            case 'robot': return 'ロボット';
            case 'storage_chest': return 'ストレージチェスト';
            case 'splitter': return '分配器';
            case 'shipping_terminal': return '出荷ターミナル';
            default: return itemType;
        }
    }

    // 施設の説明文を生成
    getBuildingInfo(building) {
        let info = `タイプ: ${this._getItemJapaneseName(building.type)}\n`;
        if (building.currentRecipe && building.currentRecipe.name) {
            info += `レシピ: ${building.currentRecipe.name}\n`;
            info += `進捗: ${Math.floor(building.craftingProgress * 100 / building.craftingSpeed)}%\n`;
        }

        // 入力インベントリ
        if (building.inputInventory) {
            if (building.inputInventory instanceof Map) { // Furnace, Assemblerの場合
                info += `入力 (${building.inputInventoryCapacity}):\n`;
                if (building.inputInventory.size === 0) {
                    info += `  (空)\n`;
                } else {
                    building.inputInventory.forEach((count, type) => {
                        info += `  ${this._getItemJapaneseName(type)}: ${count}/${building.inputInventoryCapacity}\n`;
                    });
                }
            } else if (Array.isArray(building.inputInventory)) { // 配列の場合 (StorageChest, Splitter, ShippingTerminal)
                info += `入力 (${building.inputInventoryCapacity}): ${building.inputInventory.length}/${building.inputInventoryCapacity}\n`;
                if (building.inputInventory.length > 0) {
                    const counts = {};
                    building.inputInventory.forEach(item => {
                        counts[item.type] = (counts[item.type] || 0) + 1;
                    });
                    for (const type in counts) {
                        info += `  ${this._getItemJapaneseName(type)}: ${counts[type]}\n`;
                    }
                } else {
                    info += `  (空)\n`;
                }
            }
        }

        // 出力インベントリ
        if (building.outputInventory && building.outputInventory.length !== undefined) {
            info += `出力 (${building.outputInventoryCapacity}): ${building.outputInventory.length}/${building.outputInventoryCapacity}\n`;
            if (building.outputInventory.length > 0) {
                const counts = {};
                building.outputInventory.forEach(item => {
                    counts[item.type] = (counts[item.type] || 0) + 1;
                });
                for (const type in counts) {
                    info += `  ${this._getItemJapaneseName(type)}: ${counts[type]}\n`;
                }
            } else {
                info += `  (空)\n`;
            }
        }

        // Splitterの出力インベントリ
        if (building instanceof Splitter) {
            if (building.outputInventory1.length > 0) {
                const counts = {};
                building.outputInventory1.forEach(item => {
                    counts[item.type] = (counts[item.type] || 0) + 1;
                });
                info += `出力1 (${building.outputInventoryCapacity}): ${building.outputInventory1.length}/${building.outputInventoryCapacity}\n`;
                for (const type in counts) {
                    info += `  ${this._getItemJapaneseName(type)}: ${counts[type]}\n`;
                }
            } else {
                info += `出力1 (${building.outputInventoryCapacity}): (空)\n`;
            }
            if (building.outputInventory2.length > 0) {
                const counts = {};
                building.outputInventory2.forEach(item => {
                    counts[item.type] = (counts[item.type] || 0) + 1;
                });
                info += `出力2 (${building.outputInventoryCapacity}): ${building.outputInventory2.length}/${building.outputInventoryCapacity}\n`;
                for (const type in counts) {
                    info += `  ${this._getItemJapaneseName(type)}: ${counts[type]}\n`;
                }
            } else {
                info += `出力2 (${building.outputInventoryCapacity}): (空)\n`;
            }
        }

        // コンベア上のアイテム (ConveyorBeltのみ)
        if (building.type === 'conveyor' && building.items.length > 0) {
            info += `アイテム: ${building.items.map(item => this._getItemJapaneseName(item.type)).join(', ')}\n`;
        }

        // ShippingTerminalの入力インベントリ
        if (building instanceof ShippingTerminal) {
            if (building.inputInventory.length > 0) {
                const counts = {};
                building.inputInventory.forEach(item => {
                    counts[item.type] = (counts[item.type] || 0) + 1;
                });
                info += `入力 (${building.inputInventoryCapacity}): ${building.inputInventory.length}/${building.inputInventoryCapacity}\n`;
                for (const type in counts) {
                    info += `  ${this._getItemJapaneseName(type)}: ${counts[type]}\n`;
                }
            } else {
                info += `入力 (${building.inputInventoryCapacity}): (空)\n`;
            }
        }

        return info;
    }

    // 資源の説明文を生成
    getResourceInfo(resource) {
        return `資源: ${this._getItemJapaneseName(resource.type)}`;
    }
}