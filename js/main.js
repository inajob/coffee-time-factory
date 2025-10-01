// js/main.js
import { Game } from './game.js';
import { Renderer } from './renderer.js';
import { Miner, Furnace, ConveyorBelt, Assembler, StorageChest, Splitter } from './entities.js';
import { RECIPES, getFormattedRecipes } from './recipes.js'; // RECIPESとgetFormattedRecipesをインポート

// ゲーム設定
const GRID_WIDTH = 20;
const GRID_HEIGHT = 15;
const TILE_SIZE = 24;

const game = new Game(GRID_WIDTH, GRID_HEIGHT);
const canvas = document.getElementById('gameCanvas');
const renderer = new Renderer(canvas, game, TILE_SIZE);

// game-container の高さを canvas の高さに合わせる
document.getElementById('game-container').style.height = `${canvas.height}px`;

window.game = game; // デバッグ用にグローバルに公開

let lastTime = 0;
let currentBuildingType = null;
let currentBuildingDirection = 'north';
let currentMode = 'normal'; // 'normal', 'build', 'delete'

let selectedBuilding = null; // 現在レシピ設定中の施設 (AssemblerまたはFurnace)

// 施設タイプを日本語に変換
export function getJapaneseBuildingType(type) {
    switch (type) {
        case 'conveyor': return 'ベルトコンベア';
        case 'miner': return '採掘機';
        case 'furnace': return 'かまど';
        case 'assembler': return '組立機';
        case 'storage_chest': return 'ストレージチェスト';
        case 'splitter': return '分配器';
        default: return type;
    }
}

// 向きを矢印に変換
function getDirectionArrow(direction) {
    switch (direction) {
        case 'north': return '↑';
        case 'east': return '→';
        case 'south': return '↓';
        case 'west': return '←';
        default: return '';
    }
}

// モード表示を更新する関数
function updateModeDisplay() {
    const buildingStatusElement = document.getElementById('building-status-display');
    if (currentMode === 'build') {
        const japaneseType = getJapaneseBuildingType(currentBuildingType);
        const directionArrow = getDirectionArrow(currentBuildingDirection);
        buildingStatusElement.textContent = `建設中: ${japaneseType} (向き: ${directionArrow})`;
        buildingStatusElement.style.display = 'block';
    } else if (currentMode === 'delete') {
        buildingStatusElement.textContent = `モード: 削除`;
        buildingStatusElement.style.display = 'block';
    } else {
        buildingStatusElement.textContent = '';
        buildingStatusElement.style.display = 'none';
    }
}

function gameLoop(currentTime) {
    const deltaTime = (currentTime - lastTime) / 1000; // 秒単位
    lastTime = currentTime;

    game.update(deltaTime); // ゲームの状態を更新

    // 手動採掘の処理
    if (isMining && currentMode === 'normal' && miningTarget.x !== -1) {
        miningProgress += deltaTime;
        if (miningProgress >= MINING_TIME_PER_UNIT) {
            game.mineResource(miningTarget.x, miningTarget.y);
            miningProgress = 0;
        }
    }

    renderer.draw(game);   // 画面を描画
    updateModeDisplay(); // 毎フレーム更新

    requestAnimationFrame(gameLoop);
}

// キーボード入力の処理
document.addEventListener('keydown', (e) => {
    switch (e.key) {
        case '1': // コンベア建設モード
            currentBuildingType = 'conveyor';
            currentMode = 'build';
            game.addLog('建設モード: ベルトコンベア');
            updateModeDisplay();
            break;
        case '2': // 採掘機建設モード
            currentBuildingType = 'miner';
            currentMode = 'build';
            game.addLog('建設モード: 採掘機');
            updateModeDisplay();
            break;
        case '3': // かまど建設モード
            currentBuildingType = 'furnace';
            currentMode = 'build';
            game.addLog('建設モード: かまど');
            updateModeDisplay();
            break;
        case '4': // 組立機建設モード
            currentBuildingType = 'assembler';
            currentMode = 'build';
            game.addLog('建設モード: 組立機');
            updateModeDisplay();
            break;
        case '5': // ストレージチェスト建設モード
            currentBuildingType = 'storage_chest';
            currentMode = 'build';
            game.addLog('建設モード: ストレージチェスト');
            updateModeDisplay();
            break;
        case '6': // 分配器建設モード
            currentBuildingType = 'splitter';
            currentMode = 'build';
            game.addLog('建設モード: 分配器');
            updateModeDisplay();
            break;
        case 'r': // 建設中の施設を回転
            if (currentMode === 'build') {
                const directions = ['north', 'east', 'south', 'west'];
                let currentIndex = directions.indexOf(currentBuildingDirection);
                currentBuildingDirection = directions[(currentIndex + 1) % directions.length];
                game.addLog(`建設中の施設の向きを${getDirectionArrow(currentBuildingDirection)}に回転`); // ログも日本語化
                updateModeDisplay();
            }
            break;
        case 'Escape': // モード解除
            currentBuildingType = null;
            currentMode = 'normal';
            game.addLog('モードを解除しました。');
            updateModeDisplay();
            break;
        case 'x': // 削除モード
            currentMode = 'delete';
            currentBuildingType = null; // 建設タイプはクリア
            game.addLog('モード: 削除');
            updateModeDisplay();
            break;
    }
});

let isMining = false;
let miningProgress = 0;
const MINING_TIME_PER_UNIT = 0.5; // 1個採掘するのにかかる時間（秒）
let miningTarget = { x: -1, y: -1 };

canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) { // 左クリック
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const gridX = Math.floor(mouseX / TILE_SIZE);
        const gridY = Math.floor(mouseY / TILE_SIZE);

        if (currentMode === 'normal') {
            isMining = true;
            miningTarget = { x: gridX, y: gridY };
            miningProgress = 0; // 新しい採掘ターゲットなのでリセット
        }
    }
});

canvas.addEventListener('mouseup', (e) => {
    if (e.button === 0) { // 左クリック
        isMining = false;
        miningProgress = 0;
        miningTarget = { x: -1, y: -1 };
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (isMining && currentMode === 'normal') {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const gridX = Math.floor(mouseX / TILE_SIZE);
        const gridY = Math.floor(mouseY / TILE_SIZE);

        if (gridX !== miningTarget.x || gridY !== miningTarget.y) {
            // 採掘ターゲットが変更されたらリセット
            miningTarget = { x: gridX, y: gridY };
            miningProgress = 0;
        }
    }
});

const tooltip = document.getElementById('tooltip');

// マウス移動でツールチップ表示
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const gridX = Math.floor(mouseX / TILE_SIZE);
    const gridY = Math.floor(mouseY / TILE_SIZE);

    const tileInfo = game.getTileInfo(gridX, gridY);
    let tooltipText = '';

    if (tileInfo) {
        if (tileInfo.building) {
            tooltipText = renderer.getBuildingInfo(tileInfo.building);
        } else if (tileInfo.resource) {
            tooltipText = renderer.getResourceInfo(tileInfo.resource);
        }
    }

    if (tooltipText) {
        tooltip.innerHTML = tooltipText;
        tooltip.style.left = `${e.clientX + 10}px`;
        tooltip.style.top = `${e.clientY + 10}px`;
        tooltip.style.display = 'block';
    } else {
        tooltip.style.display = 'none';
    }
});

canvas.addEventListener('mouseleave', () => {
    tooltip.style.display = 'none';
});

// マウスクリックで施設を建設/削除/設定 (normalモードでのクリックイベントは残す)
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const gridX = Math.floor(mouseX / TILE_SIZE);
    const gridY = Math.floor(mouseY / TILE_SIZE);

    if (currentMode === 'build') {
        game.placeBuilding(gridX, gridY, currentBuildingType, currentBuildingDirection);
    } else if (currentMode === 'delete') {
        game.removeBuilding(gridX, gridY);
    } else if (currentMode === 'normal') { // normalモードでクリックした場合
        const clickedBuilding = game.grid[gridY][gridX].building;
        if (clickedBuilding) {
            if (clickedBuilding instanceof Assembler || clickedBuilding instanceof Furnace) { // AssemblerまたはFurnaceの場合、レシピモーダルを開く
                selectedBuilding = clickedBuilding;
                openRecipeModal(selectedBuilding.type);
            } else { // その他の施設の場合、アイテム回収を試みる
                game.collectItemsFromBuilding(gridX, gridY);
            }
        } else {
            // 施設がない場所をクリックした場合、何もしない
        }
    }
});

// レシピモーダル関連のDOM要素
const recipeModal = document.getElementById('recipe-modal');
const recipeListDiv = document.getElementById('recipe-list');
const setRecipeButton = document.getElementById('set-recipe-button');
const closeModalButton = document.getElementById('close-modal-button');

let currentSelectedRecipe = null;

function openRecipeModal(buildingType) {
    recipeListDiv.innerHTML = ''; // リストをクリア
    const recipes = RECIPES[buildingType]; // 施設のタイプに応じたレシピを取得

    recipes.forEach(recipe => {
        const recipeDiv = document.createElement('div');
        recipeDiv.textContent = `${recipe.name} (材料: ${recipe.input.map(i => `${i.type}x${i.amount}`).join(', ')})`;
        recipeDiv.onclick = () => {
            // 選択状態をリセット
            Array.from(recipeListDiv.children).forEach(child => child.classList.remove('selected'));
            recipeDiv.classList.add('selected');
            currentSelectedRecipe = recipe;
        };
        recipeListDiv.appendChild(recipeDiv);
    });

    recipeModal.style.display = 'flex'; // モーダルを表示
}

setRecipeButton.onclick = () => {
    if (selectedBuilding && currentSelectedRecipe) {
        game.setBuildingRecipe(selectedBuilding.x, selectedBuilding.y, currentSelectedRecipe);
        closeRecipeModal();
    }
};

closeModalButton.onclick = () => {
    closeRecipeModal();
};

function closeRecipeModal() {
    recipeModal.style.display = 'none';
    selectedBuilding = null;
    currentSelectedRecipe = null;
}

// 初期表示
updateModeDisplay();

// チートシートの内容を生成して表示
const cheatSheetContent = document.getElementById('cheat-sheet-content');
cheatSheetContent.innerHTML = getFormattedRecipes(renderer._getItemJapaneseName.bind(renderer));

// ゲームループ開始
requestAnimationFrame(gameLoop);