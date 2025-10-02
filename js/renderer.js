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

        // 3. 資源の描画
        for (let y = 0; y < game.gridHeight; y++) {
            for (let x = 0; x < game.gridWidth; x++) {
                const tile = game.grid[y][x];
                if (tile.resource) {
                    this.ctx.fillStyle = getItemColor(tile.resource.type);
                    this.ctx.beginPath();
                    this.ctx.arc(x * this.tileSize + this.tileSize / 2, y * this.tileSize + this.tileSize / 2, this.tileSize / 8, 0, Math.PI * 2); // 半径を tileSize / 8 に変更
                    this.ctx.fill();
                }
            }
        }

        // 4. ベルトコンベア上のアイテムの描画
        for (let y = 0; y < game.gridHeight; y++) {
            for (let x = 0; x < game.gridWidth; x++) {
                const tile = game.grid[y][x];
                if (tile.building instanceof ConveyorBelt) {
                    const conveyor = tile.building;
                    conveyor.items.forEach(item => {
                        const itemSize = this.tileSize / 3; // アイテムサイズ

                        let drawX = conveyor.x * this.tileSize;
                        let drawY = conveyor.y * this.tileSize;

                        // アイテムの相対位置に基づいて描画位置を調整
                        let itemPositionInTile = item.position; // 0.0 to 1.0

                        // 通常の描画位置計算 (アイテムの中心座標)
                        let centerX, centerY;
                        if (conveyor.direction === 'north') {
                            centerY = drawY + this.tileSize - (itemPositionInTile * this.tileSize);
                            centerX = drawX + this.tileSize / 2;
                        } else if (conveyor.direction === 'east') {
                            centerX = drawX + (itemPositionInTile * this.tileSize);
                            centerY = drawY + this.tileSize / 2;
                        } else if (conveyor.direction === 'south') {
                            centerY = drawY + (itemPositionInTile * this.tileSize);
                            centerX = drawX + this.tileSize / 2;
                        } else if (conveyor.direction === 'west') {
                            centerX = drawX + this.tileSize - (itemPositionInTile * this.tileSize);
                            centerY = drawY + this.tileSize / 2;
                        }

                        // 前のコンベアの向きを考慮した補正 (positionが0.5未満の場合)
                        if (itemPositionInTile < 0.5) {
                            // 前のコンベアの方向と現在のコンベアの方向が異なる場合
                            if (item.previousConveyorDirection && item.previousConveyorDirection !== conveyor.direction) {
                                const interpolationFactor = (0.5 - itemPositionInTile) * 2; // 0.0 -> 0.5 で 1 -> 0 に変化
                                const offset = this.tileSize / 2 * interpolationFactor; // 補正量 (タイルの半分を基準に補正)

                                // 前のコンベアの方向から現在のコンベアの始点へ向かって補正
                                if (item.previousConveyorDirection === 'north') { // 前が北向き
                                    if (conveyor.direction === 'east') { // 現在が東向き (右折)
                                        centerX = drawX + this.tileSize/2; // 左にずらす
                                        centerY += offset; // 下にずらす
                                    } else if (conveyor.direction === 'west') { // 現在が西向き (左折)
                                        centerX = drawX + this.tileSize/2;
                                        centerY += offset; // 下にずらす
                                    }
                                } else if (item.previousConveyorDirection === 'east') { // 前が東向き
                                    if (conveyor.direction === 'south') { // 現在が南向き (右折)
                                        centerY = drawY + this.tileSize/2;
                                        centerX -= offset; // 左にずらす
                                    } else if (conveyor.direction === 'north') { // 現在が北向き (左折)
                                        centerY = drawY + this.tileSize/2;; // 下にずらす
                                        centerX -= offset; // 左にずらす
                                    }
                                } else if (item.previousConveyorDirection === 'south') { // 前が南向き
                                    if (conveyor.direction === 'west') { // 現在が西向き (右折)
                                        centerX = drawX + this.tileSize/2;
                                        centerY -= offset; // 上にずらす
                                    } else if (conveyor.direction === 'east') { // 現在が東向き (左折)
                                        centerX = drawX + this.tileSize/2;
                                        centerY -= offset; // 上にずらす
                                    }
                                } else if (item.previousConveyorDirection === 'west') { // 前が西向き
                                    if (conveyor.direction === 'north') { // 現在が北向き (右折)
                                        centerY = drawY + this.tileSize/2;
                                        centerX += offset; // 右にずらす
                                    } else if (conveyor.direction === 'south') { // 現在が南向き (左折)
                                        centerY = drawY + this.tileSize/2;
                                        centerX += offset; // 右にずらす
                                    }
                                }
                            }
                        }

                        this.ctx.fillStyle = getItemColor(item.type);
                        this.ctx.fillRect(centerX - itemSize / 2, centerY - itemSize / 2, itemSize, itemSize);
                    });
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
            info += this._formatInventoryInfo(building.inputInventory, building.inputInventoryCapacity, '入力');
        }

        // 出力インベントリ
        if (building.outputInventory && building.outputInventory.length !== undefined) {
            info += this._formatInventoryInfo(building.outputInventory, building.outputInventoryCapacity, '出力');
        }

        // Splitterの出力インベントリ
        if (building instanceof Splitter) {
            info += this._formatInventoryInfo(building.outputInventory1, building.outputInventoryCapacity, '出力1');
            info += this._formatInventoryInfo(building.outputInventory2, building.outputInventoryCapacity, '出力2');
        }

        // ShippingTerminalの入力インベントリ
        if (building instanceof ShippingTerminal) {
            info += this._formatInventoryInfo(building.inputInventory, building.inputInventoryCapacity, '入力');
        }

        return info;
    }

    // 資源の説明文を生成
    getResourceInfo(resource) {
        return `資源: ${this._getItemJapaneseName(resource.type)}`;
    }

    // インベントリ情報を整形するヘルパーメソッド
    _formatInventoryInfo(inventory, capacity, title) {
        let infoText = `${title} (${capacity}):\n`;
        if (inventory instanceof Map) {
            if (inventory.size === 0) {
                infoText += `  (空)\n`;
            } else {
                inventory.forEach((count, type) => {
                    infoText += `  ${this._getItemJapaneseName(type)}: ${count}/${capacity}\n`;
                });
            }
        } else if (Array.isArray(inventory)) {
            infoText += `  ${inventory.length}/${capacity}\n`;
            if (inventory.length > 0) {
                const counts = {};
                inventory.forEach(item => {
                    counts[item.type] = (counts[item.type] || 0) + 1;
                });
                for (const type in counts) {
                    infoText += `  ${this._getItemJapaneseName(type)}: ${counts[type]}\n`;
                }
            } else {
                infoText += `  (空)\n`;
            }
        }
        return infoText;
    }
}