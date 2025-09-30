### 新しい最終目標

最終目標を「**電子基板 (electronic_circuit) を10個クラフトする**」に変更します。

### 1. 資源 (Resources) - マップから直接採掘

*   `iron_ore` (鉄鉱石)
*   `copper_ore` (銅鉱石)
*   `coal` (石炭)

### 2. アイテム (Items) - 加工・クラフトで生成

*   **基本素材:**
    *   `iron_plate` (鉄板)
    *   `copper_plate` (銅板)
    *   `copper_wire` (銅線)
*   **最終目標アイテム:**
    *   `electronic_circuit` (電子基板)

### 3. レシピ (Recipes)

#### かまど (Furnace) レシピ
*   **鉄板:** `iron_ore` (1) + `coal` (1) -> `iron_plate` (1) / `crafting_time`: 1秒
*   **銅板:** `copper_ore` (1) + `coal` (1) -> `copper_plate` (1) / `crafting_time`: 1秒

#### 組立機 (Assembler) レシピ
*   **銅線:** `copper_plate` (1) -> `copper_wire` (2) / `crafting_time`: 0.5秒
*   **電子基板:** `iron_plate` (1) + `copper_wire` (3) -> `electronic_circuit` (1) / `crafting_time`: 1秒

### 4. 施設 (Buildings) - すべて `1x1` サイズ

*   `miner` (採掘機)
*   `furnace` (かまど)
*   `conveyor` (ベルトコンベア)
*   `assembler` (組立機)

### 5. 施設のクラフトコスト

*   `miner`: `iron_plate` (3)
*   `furnace`: `iron_plate` (3)
*   `conveyor`: `iron_plate` (1)
*   `assembler`: `iron_plate` (5), `copper_wire` (3)