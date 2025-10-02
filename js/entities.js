import { getItemColor } from './utils.js';

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
        this.outputInventoryCapacity = 5; // 出力インベントリの容量
    }

    update(deltaTime, game) {
        // 採掘ロジック
        const tile = game.grid[this.y][this.x];
        // outputInventoryが満杯の場合は採掘しない
        if (this.outputInventory.length >= this.outputInventoryCapacity) {
            return;
        }

        if (tile.resource) { // amountチェックを削除
            this.miningProgress += deltaTime;
            if (this.miningProgress >= this.miningSpeed) {
                // 1個採掘
                const minedItemType = tile.resource.type;
                this.outputInventory.push({ type: minedItemType });
                // tile.resource.amount--; // amountの減少を削除
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
        this.inputInventory = new Map(); // 材料をMapで保持 { type: count }
        this.outputInventory = []; // 完成品を保持
        this.currentRecipe = null; // { input: [{type: 'iron_ore', amount: 1}], output: [{type: 'iron_plate', amount: 1}] }
        this.outputInventoryCapacity = 5; // 出力インベントリの容量
        this.inputInventoryCapacity = 10; // 入力インベントリの容量 (材料と燃料を保持できる量に調整)
    }

    update(deltaTime, game) {
        // レシピが設定されていない場合は処理を中断
        if (!this.currentRecipe) return;

        // outputInventoryが満杯の場合は生産しない
        if (this.outputInventory.length >= this.outputInventoryCapacity) {
            return;
        }

        // 材料が揃っているかチェック
        const hasIngredients = this.currentRecipe.input.every(req =>
            (this.inputInventory.get(req.type) || 0) >= req.amount
        );

        if (hasIngredients) {
            this.craftingProgress += deltaTime;
            if (this.craftingProgress >= this.craftingSpeed) {
                // 材料を消費
                this.currentRecipe.input.forEach(req => {
                    const currentAmount = this.inputInventory.get(req.type) || 0;
                    this.inputInventory.set(req.type, currentAmount - req.amount);
                    if (this.inputInventory.get(req.type) <= 0) {
                        this.inputInventory.delete(req.type);
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

        // アイテムの描画はRendererで一括管理するため削除
    }
}

export class Assembler extends Building {
    constructor(x, y, direction = 'north') {
        super(x, y, 'assembler', direction);
        this.craftingProgress = 0;
        this.inputInventory = new Map(); // 材料をMapで保持 { type: count }
        this.outputInventory = []; // 完成品を保持
        this.currentRecipe = null; // { input: [{type: 'iron_plate', amount: 1}], output: [{type: 'gear', amount: 1}] }
        this.outputInventoryCapacity = 5; // 出力インベントリの容量
        this.inputInventoryCapacity = 5; // 入力インベントリの容量
    }

    update(deltaTime, game) {
        if (!this.currentRecipe) return;

        // outputInventoryが満杯、または今回の生産で満杯になる場合は生産しない
        const totalOutputAmount = this.currentRecipe.output.reduce((sum, out) => sum + out.amount, 0);
        if (this.outputInventory.length + totalOutputAmount > this.outputInventoryCapacity) {
            return;
        }

        // 材料が揃っているかチェック
        const hasIngredients = this.currentRecipe.input.every(req =>
            (this.inputInventory.get(req.type) || 0) >= req.amount
        );

        if (hasIngredients) {
            this.craftingProgress += deltaTime;
            if (this.craftingProgress >= this.craftingSpeed) {
                // 材料を消費
                this.currentRecipe.input.forEach(req => {
                    const currentAmount = this.inputInventory.get(req.type) || 0;
                    this.inputInventory.set(req.type, currentAmount - req.amount);
                    if (this.inputInventory.get(req.type) <= 0) {
                        this.inputInventory.delete(req.type);
                    }
                });

                // 完成品を生成
                this.currentRecipe.output.forEach(out => {
                    for (let i = 0; i < out.amount; i++) {
                        this.outputInventory.push({ type: out.type });
                        // 最終目標アイテムが作られたらカウント
                        if (out.type === game.goal.type) {
                            game.goalItemCount++;
                        }
                        // ロボットが作られたら生産レートを更新
                        if (out.type === 'robot') {
                            game.robotProductionCount++;
                            const currentTime = game.time; // 現在のゲーム時間
                            if (game.lastRobotProductionTime !== 0) {
                                const timeElapsed = game.lastRobotProductionTime - currentTime;
                                if (timeElapsed > 0) {
                                    game.robotProductionRate = 1 / timeElapsed; // 1個あたりの時間からレートを計算
                                } else {
                                    game.robotProductionRate = Infinity; // 同時に複数生産された場合など
                                }
                            }
                            game.lastRobotProductionTime = currentTime;
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
    constructor(type, position = 0, previousConveyorDirection = 'north') {
        this.type = type;
        this.position = position; // 0.0 (入口) から 1.0 (出口)
        this.previousConveyorDirection = previousConveyorDirection;
    }
}

export class StorageChest extends Building {
    constructor(x, y) {
        super(x, y, 'storage_chest', 'north'); // 向きは関係ないのでnorthで固定
        this.inputInventory = []; // アイテムを貯蔵
        this.inputInventoryCapacity = 10; // ストレージチェストの容量
    }

    update(deltaTime, game) {
        // 特に自動的な処理はなし
    }

    draw(ctx, tileSize) {
        ctx.fillStyle = '#8B4513'; // 茶色
        ctx.fillRect(this.x * tileSize, this.y * tileSize, tileSize, tileSize);
        ctx.strokeStyle = 'white';
        ctx.strokeRect(this.x * tileSize, this.y * tileSize, tileSize, tileSize);

        // チェストの蓋のような模様
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(this.x * tileSize + tileSize * 0.1, this.y * tileSize + tileSize * 0.1, tileSize * 0.8, tileSize * 0.3);
        ctx.fillRect(this.x * tileSize + tileSize * 0.1, this.y * tileSize + tileSize * 0.6, tileSize * 0.8, tileSize * 0.3);
    }
}

export class Splitter extends Building {
    constructor(x, y, direction = 'north') {
        super(x, y, 'splitter', direction);
        this.inputInventory = [];
        this.outputInventory1 = []; // 左側出力
        this.outputInventory2 = []; // 右側出力
        this.inputInventoryCapacity = 5;
        this.outputInventoryCapacity = 5;
        this.distributionTimer = 0;
        this.distributionInterval = 0.5; // 0.5秒ごとに分配
        this.lastDistributedOutput = 2; // 最後に分配した出力ポート (1または2)。最初は2から始めることで、output1から分配されるようにする
    }

    update(deltaTime, game) {
        this.distributionTimer += deltaTime;

        if (this.distributionTimer >= this.distributionInterval) {
            this.distributionTimer = 0;

            if (this.inputInventory.length > 0) {
                const itemToDistribute = this.inputInventory[0];

                // どちらかの出力に空きがあるか
                const hasSpace1 = this.outputInventory1.length < this.outputInventoryCapacity;
                const hasSpace2 = this.outputInventory2.length < this.outputInventoryCapacity;

                if (hasSpace1 && hasSpace2) {
                    // 両方に空きがあれば、前回と逆の出力に分配
                    if (this.lastDistributedOutput === 1) {
                        this.outputInventory2.push(this.inputInventory.shift());
                        this.lastDistributedOutput = 2;
                    } else {
                        this.outputInventory1.push(this.inputInventory.shift());
                        this.lastDistributedOutput = 1;
                    }
                } else if (hasSpace1) {
                    // output1にのみ空きがあればそちらへ
                    this.outputInventory1.push(this.inputInventory.shift());
                    this.lastDistributedOutput = 1;
                } else if (hasSpace2) {
                    // output2にのみ空きがあればそちらへ
                    this.outputInventory2.push(this.inputInventory.shift());
                    this.lastDistributedOutput = 2;
                }
                // 両方満杯の場合はinputInventoryに留まる (バックプレッシャー)
            }
        }
    }

    draw(ctx, tileSize) {
        ctx.fillStyle = '#696969'; // スプリッターの色
        ctx.fillRect(this.x * tileSize, this.y * tileSize, tileSize, tileSize);
        ctx.strokeStyle = 'white';
        ctx.strokeRect(this.x * tileSize, this.y * tileSize, tileSize, tileSize);

        // 分配方向を示す矢印
        super._drawDirectionArrow(ctx, tileSize, this.direction, '#A9A9A9');

        // 出力方向を示す矢印 (左右に分岐)
        const centerX = this.x * tileSize + tileSize / 2;
        const centerY = this.y * tileSize + tileSize / 2;
        const arrowSize = tileSize / 4;

        ctx.fillStyle = '#A9A9A9';
        ctx.beginPath();
        if (this.direction === 'north' || this.direction === 'south') {
            // 左右に分岐
            ctx.moveTo(centerX - arrowSize, centerY);
            ctx.lineTo(centerX, centerY - arrowSize);
            ctx.lineTo(centerX + arrowSize, centerY);

            ctx.moveTo(centerX - arrowSize, centerY);
            ctx.lineTo(centerX, centerY + arrowSize);
            ctx.lineTo(centerX + arrowSize, centerY);
        } else { // east, west
            // 上下に分岐
            ctx.moveTo(centerX, centerY - arrowSize);
            ctx.lineTo(centerX - arrowSize, centerY);
            ctx.lineTo(centerX, centerY + arrowSize);

            ctx.moveTo(centerX, centerY - arrowSize);
            ctx.lineTo(centerX + arrowSize, centerY);
            ctx.lineTo(centerX, centerY + arrowSize);
        }
        ctx.closePath();
        ctx.fill();
    }
}

export class ShippingTerminal extends Building {
    constructor(x, y, direction = 'north') {
        super(x, y, 'shipping_terminal', direction);
        this.inputInventory = [];
        this.inputInventoryCapacity = 5;
        this.shippingTimer = 0;
        this.shippingInterval = 0.1; // 0.1秒ごとに1個出荷
    }

    update(deltaTime, game) {
        this.shippingTimer += deltaTime;

        if (this.shippingTimer >= this.shippingInterval) {
            this.shippingTimer = 0;

            if (this.inputInventory.length > 0) {
                const itemToShip = this.inputInventory[0];
                if (itemToShip.type === 'robot') {
                    this.inputInventory.shift(); // アイテムを消費
                    game.totalRobotsShipped++; // 出荷数をカウント
                    game.addLog(`ロボットを1個出荷しました。総出荷数: ${game.totalRobotsShipped}`);
                }
            }
        }
    }

    draw(ctx, tileSize) {
        ctx.fillStyle = '#4682B4'; // 出荷ターミナルの色
        ctx.fillRect(this.x * tileSize, this.y * tileSize, tileSize, tileSize);
        ctx.strokeStyle = 'white';
        ctx.strokeRect(this.x * tileSize, this.y * tileSize, tileSize, tileSize);

        // 向きを示す矢印
        super._drawDirectionArrow(ctx, tileSize, this.direction, '#ADD8E6');

        // 出荷アイコン (簡易版)
        ctx.fillStyle = 'white';
        ctx.font = `${tileSize / 2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('SHIP', this.x * tileSize + tileSize / 2, this.y * tileSize + tileSize / 2);
    }
}
