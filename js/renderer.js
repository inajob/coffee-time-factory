// js/renderer.js
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

        // グリッドの描画
        for (let y = 0; y < game.gridHeight; y++) {
            for (let x = 0; x < game.gridWidth; x++) {
                const tile = game.grid[y][x];
                this.ctx.fillStyle = '#444'; // 地面の色
                if (tile.type === 'water') {
                    this.ctx.fillStyle = '#2a4d69'; // 水の色
                } else if (tile.resource) {
                    this.ctx.fillStyle = '#6b4e3e'; // 資源があるタイルの色
                }
                this.ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);

                // 資源の描画
                if (tile.resource) {
                    this.ctx.fillStyle = this._getResourceColor(tile.resource.type);
                    this.ctx.beginPath();
                    this.ctx.arc(x * this.tileSize + this.tileSize / 2, y * this.tileSize + this.tileSize / 2, this.tileSize / 3, 0, Math.PI * 2);
                    this.ctx.fill();
                    // 資源の残量表示 (デバッグ用)
                    this.ctx.fillStyle = 'white';
                    this.ctx.font = '8px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText(tile.resource.amount, x * this.tileSize + this.tileSize / 2, y * this.tileSize + this.tileSize / 2 + 3);
                }

                // グリッド線
                this.ctx.strokeStyle = '#555';
                this.ctx.strokeRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);

                // 施設の描画
                if (tile.building) {
                    tile.building.draw(this.ctx, this.tileSize);
                }
            }
        }

        // プレイヤーの描画は削除
        // game.player.draw(this.ctx, this.tileSize);

        // UI情報の更新 (DOM操作)
        document.getElementById('time-display').textContent = `時間: ${Math.floor(game.time / 60).toString().padStart(2, '0')}:${Math.floor(game.time % 60).toString().padStart(2, '0')}`;
        document.getElementById('goal-display').textContent = `目標: ${game.goal.type}を${game.goal.targetCount}個クラフト (${game.electronicCircuitCount}/${game.goal.targetCount})`;
        document.getElementById('log-display').innerHTML = game.log.map(msg => `<div>${msg}</div>`).join('');

        // インベントリ表示
        const inventoryDisplay = document.getElementById('inventory-display');
        let inventoryHtml = 'インベントリ:<br>';
        for (const itemType in game.inventory) {
            inventoryHtml += `<div>${itemType}: ${game.inventory[itemType]}</div>`;
        }
        inventoryDisplay.innerHTML = inventoryHtml;
    }

    _getResourceColor(resourceType) {
        switch (resourceType) {
            case 'iron_ore': return 'sienna';
            case 'copper_ore': return 'darkgoldenrod';
            case 'coal': return 'darkslategray';
            default: return 'white';
        }
    }
}