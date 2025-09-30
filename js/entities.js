// js/entities.js

// Playerクラス全体を削除

export class Building {
    constructor(x, y, type, direction = 'north') {
        this.x = x;
        this.y = y;
        this.type = type; // 'miner', 'furnace', 'conveyor'
        this.direction = direction; // 'north', 'east', 'south', 'west'
        this.size = { width: 1, height: 1 }; // すべて1x1
    }

    update(deltaTime, game) {
        // 各施設固有の更新ロジックは子クラスで実装
    }

    draw(ctx, tileSize) {
        // 各施設固有の描画ロジックは子クラスで実装
    }

    rotate() {
        const directions = ['north', 'east', 'south', 'west'];
        let currentIndex = directions.indexOf(this.direction);
        this.direction = directions[(currentIndex + 1) % directions.length];
    }

    _drawDirectionArrow(ctx, tileSize, direction, color) {
        ctx.fillStyle = color;
        const centerX = this.x * tileSize + tileSize / 2;
        const centerY = this.y * tileSize + tileSize / 2;
        const arrowSize = tileSize / 4;

        ctx.beginPath();
        if (direction === 'north') {
            ctx.moveTo(centerX, centerY - arrowSize);
            ctx.lineTo(centerX - arrowSize, centerY + arrowSize);
            ctx.lineTo(centerX + arrowSize, centerY + arrowSize);
        } else if (direction === 'east') {
            ctx.moveTo(centerX + arrowSize, centerY);
            ctx.lineTo(centerX - arrowSize, centerY - arrowSize);
            ctx.lineTo(centerX - arrowSize, centerY + arrowSize);
        } else if (direction === 'south') {
            ctx.moveTo(centerX, centerY + arrowSize);
            ctx.lineTo(centerX - arrowSize, centerY - arrowSize);
            ctx.lineTo(centerX + arrowSize, centerY - arrowSize);
        } else if (direction === 'west') {
            ctx.moveTo(centerX - arrowSize, centerY);
            ctx.lineTo(centerX + arrowSize, centerY - arrowSize);
            ctx.lineTo(centerX + arrowSize, centerY + arrowSize);
        }
        ctx.closePath();
        ctx.fill();
    }
}

export class Miner extends Building {
    constructor(x, y, direction = 'north') {
        super(x, y, 'miner', direction);
        this.miningSpeed = 1; // 1秒に1個
        this.miningProgress = 0;
        this.outputInventory = []; // 採掘したアイテムを一時的に保持
    }

    update(deltaTime, game) {
        // 採掘ロジック
        const tile = game.grid[this.y][this.x];
        if (tile.resource && tile.resource.amount > 0) {
            this.miningProgress += deltaTime;
            if (this.miningProgress >= this.miningSpeed) {
                // 1個採掘
                const minedItemType = tile.resource.type;
                this.outputInventory.push({ type: minedItemType });
                tile.resource.amount--;
                this.miningProgress = 0;
                game.addLog(`${minedItemType}を1個採掘しました。`);
            }
        }
    }

    draw(ctx, tileSize) {
        ctx.fillStyle = 'darkgreen'; // 採掘機の色
        ctx.fillRect(this.x * tileSize, this.y * tileSize, tileSize, tileSize);
        ctx.strokeStyle = 'white';
        ctx.strokeRect(this.x * tileSize, this.y * tileSize, tileSize, tileSize);

        // 向きを示す矢印
        super._drawDirectionArrow(ctx, tileSize, this.direction, 'lightgreen');
    }
}

export class Furnace extends Building {
    constructor(x, y, direction = 'north') {
        super(x, y, 'furnace', direction);
        this.craftingSpeed = 1; // 1秒に1個
        this.craftingProgress = 0;
        this.inputInventory = []; // 材料を保持
        this.outputInventory = []; // 完成品を保持
        this.fuelInventory = []; // 燃料を保持
        this.currentRecipe = null; // { input: [{type: 'iron_ore', amount: 1}], output: [{type: 'iron_plate', amount: 1}], fuel: [{type: 'coal', amount: 1}] }
    }

    update(deltaTime, game) {
        // レシピが設定されていない場合は処理を中断
        if (!this.currentRecipe) return;

        // 燃料のチェックをcurrentRecipe.fuelに基づいて行う
        const hasFuel = this.currentRecipe.fuel.every(req =>
            this.fuelInventory.filter(item => item.type === req.type).length >= req.amount
        );
        if (!hasFuel) return; // 燃料が足りないと動かない

        // 材料が揃っているかチェック
        const hasIngredients = this.currentRecipe.input.every(req =>
            this.inputInventory.filter(item => item.type === req.type).length >= req.amount
        );

        if (hasIngredients) {
            this.craftingProgress += deltaTime;
            if (this.craftingProgress >= this.craftingSpeed) {
                // 材料を消費
                this.currentRecipe.input.forEach(req => {
                    for (let i = 0; i < req.amount; i++) {
                        const index = this.inputInventory.findIndex(item => item.type === req.type);
                        if (index !== -1) this.inputInventory.splice(index, 1);
                    }
                });
                // 燃料を消費
                this.currentRecipe.fuel.forEach(req => {
                    for (let i = 0; i < req.amount; i++) {
                        const index = this.fuelInventory.findIndex(item => item.type === req.type);
                        if (index !== -1) this.fuelInventory.splice(index, 1);
                    }
                });

                // 完成品を生成
                this.currentRecipe.output.forEach(out => {
                    for (let i = 0; i < out.amount; i++) {
                        this.outputInventory.push({ type: out.type });
                    }
                });
                this.craftingProgress = 0;
                game.addLog(`${this.currentRecipe.output[0].type}を1個精錬しました。`);
            }
        }
    }

    draw(ctx, tileSize) {
        ctx.fillStyle = 'orange'; // かまどの色
        ctx.fillRect(this.x * tileSize, this.y * tileSize, tileSize, tileSize);
        ctx.strokeStyle = 'white';
        ctx.strokeRect(this.x * tileSize, this.y * tileSize, tileSize, tileSize);

        // 向きを示す矢印
        super._drawDirectionArrow(ctx, tileSize, this.direction, 'red');
    }
}

export class ConveyorBelt extends Building {
    constructor(x, y, direction = 'north') {
        super(x, y, 'conveyor', direction);
        this.items = []; // { type: 'iron_plate', position: 0.5 }
        this.speed = 1; // 1秒に1タイル移動
    }

    update(deltaTime, game) {
        // アイテムの移動ロジックはgame.jsで一括管理する
        // ここではアイテムの追加・削除のみ
    }

    draw(ctx, tileSize) {
        ctx.fillStyle = 'gray'; // コンベアの色
        ctx.fillRect(this.x * tileSize, this.y * tileSize, tileSize, tileSize);
        ctx.strokeStyle = 'white';
        ctx.strokeRect(this.x * tileSize, this.y * tileSize, tileSize, tileSize);

        // 向きを示す矢印
        super._drawDirectionArrow(ctx, tileSize, this.direction, 'lightgray');

        // アイテムの描画 (game.jsで管理されるitems配列から描画)
        this.items.forEach(item => {
            const itemX = this.x * tileSize;
            const itemY = this.y * tileSize;
            const itemSize = tileSize / 2;

            let drawX = itemX;
            let drawY = itemY;

            // アイテムの相対位置に基づいて描画位置を調整
            if (this.direction === 'north') {
                drawY = itemY + tileSize - (item.position * tileSize) - itemSize / 2;
                drawX = itemX + tileSize / 2 - itemSize / 2;
            } else if (this.direction === 'east') {
                drawX = itemX + (item.position * tileSize) - itemSize / 2;
                drawY = itemY + tileSize / 2 - itemSize / 2;
            } else if (this.direction === 'south') {
                drawY = itemY + (item.position * tileSize) - itemSize / 2;
                drawX = itemX + tileSize / 2 - itemSize / 2;
            } else if (this.direction === 'west') {
                drawX = itemX + tileSize - (item.position * tileSize) - itemSize / 2;
                drawY = itemY + tileSize / 2 - itemSize / 2;
            }

            ctx.fillStyle = this._getItemColor(item.type);
            ctx.fillRect(drawX, drawY, itemSize, itemSize);
        });
    }

    _getItemColor(itemType) {
        switch (itemType) {
            case 'iron_ore': return 'brown';
            case 'iron_plate': return 'silver';
            case 'copper_ore': return 'peru';
            case 'copper_plate': return 'chocolate';
            case 'coal': return 'black';
            case 'copper_wire': return 'goldenrod'; // 銅線
            case 'electronic_circuit': return 'lime'; // 電子基板
            default: return 'white';
        }
    }
}

export class Assembler extends Building {
    constructor(x, y, direction = 'north') {
        super(x, y, 'assembler', direction);
        this.craftingSpeed = 1; // 1秒に1個
        this.craftingProgress = 0;
        this.inputInventory = []; // 材料を保持
        this.outputInventory = []; // 完成品を保持
        this.currentRecipe = null; // { input: [{type: 'iron_plate', amount: 1}], output: [{type: 'gear', amount: 1}] }
    }

    update(deltaTime, game) {
        if (!this.currentRecipe) return;

        // 材料が揃っているかチェック
        const hasIngredients = this.currentRecipe.input.every(req =>
            this.inputInventory.filter(item => item.type === req.type).length >= req.amount
        );

        if (hasIngredients) {
            this.craftingProgress += deltaTime;
            if (this.craftingProgress >= this.craftingSpeed) {
                // 材料を消費
                this.currentRecipe.input.forEach(req => {
                    for (let i = 0; i < req.amount; i++) {
                        const index = this.inputInventory.findIndex(item => item.type === req.type);
                        if (index !== -1) this.inputInventory.splice(index, 1);
                    }
                });

                // 完成品を生成
                this.currentRecipe.output.forEach(out => {
                    for (let i = 0; i < out.amount; i++) {
                        this.outputInventory.push({ type: out.type });
                        // 電子基板が作られたらカウント
                        if (out.type === game.goal.type) {
                            game.electronicCircuitCount++;
                        }
                    }
                });
                this.craftingProgress = 0;
                game.addLog(`${this.currentRecipe.output[0].type}を1個組み立てました。`);
            }
        }
    }

    draw(ctx, tileSize) {
        ctx.fillStyle = 'purple'; // 組立機の色
        ctx.fillRect(this.x * tileSize, this.y * tileSize, tileSize, tileSize);
        ctx.strokeStyle = 'white';
        ctx.strokeRect(this.x * tileSize, this.y * tileSize, tileSize, tileSize);

        // 向きを示す矢印
        super._drawDirectionArrow(ctx, tileSize, this.direction, 'magenta');
    }
}

export class Item {
    constructor(type, position = 0) {
        this.type = type;
        this.position = position; // 0.0 (入口) から 1.0 (出口)
    }
}
