### 新しい最終目標

最終目標を「**ロボット (robot) を100個インベントリに入れる**」に変更します。

### 1. 資源 (Resources) - マップから直接採掘

*   `iron_ore` (鉄鉱石)
*   `copper_ore` (銅鉱石)
*   `coal` (石炭)
*   `quartz_ore` (石英鉱石) - **NEW**

### 2. アイテム (Items) - 加工・クラフトで生成

*   **基本素材:**
    *   `iron_plate` (鉄板)
    *   `copper_plate` (銅板)
    *   `copper_wire` (銅線)
    *   `gear` (歯車) - **NEW**
    *   `glass` (ガラス) - **NEW**
    *   `plastic` (プラスチック) - **NEW**
*   **中間素材:**
    *   `electronic_circuit` (電子基板) - **NEW**
    *   `advanced_processor` (高度プロセッサ) - **NEW**
    *   `robot_body` (ロボットボディ) - **NEW**
*   **最終目標アイテム:**
    *   `robot` (ロボット) - **NEW**

### 3. レシピ (Recipes)

#### かまど (Furnace) レシピ
*   **鉄板:** `iron_ore` (1) + `coal` (1) → `iron_plate` (1) / `crafting_time`: 1秒
*   **銅板:** `copper_ore` (1) + `coal` (1) → `copper_plate` (1) / `crafting_time`: 1秒
*   **ガラス:** `quartz_ore` (2) + `coal` (1) → `glass` (1) / `crafting_time`: 1.5秒 - **NEW**
*   **プラスチック:** `coal` (3) → `plastic` (1) / `crafting_time`: 2秒 - **NEW**

#### 組立機 (Assembler) レシピ
*   **銅線:** `copper_plate` (1) → `copper_wire` (2) / `crafting_time`: 0.5秒
*   **歯車:** `iron_plate` (2) → `gear` (1) / `crafting_time`: 0.5秒 - **NEW**
*   **電子基板:** `iron_plate` (1) + `copper_wire` (3) → `electronic_circuit` (1) / `crafting_time`: 1秒 - **NEW**
*   **高度プロセッサ:** `electronic_circuit` (2) + `glass` (1) + `plastic` (1) → `advanced_processor` (1) / `crafting_time`: 3秒 - **NEW**
*   **ロボットボディ:** `advanced_processor` (1) + `gear` (3) + `iron_plate` (5) → `robot_body` (1) / `crafting_time`: 4秒 - **NEW**
*   **ロボット:** `robot_body` (1) + `electronic_circuit` (2) + `advanced_processor` (1) → `robot` (1) / `crafting_time`: 5秒 - **NEW**

### 4. 施設 (Buildings) - すべて `1x1` サイズ

*   `miner` (採掘機)
*   `furnace` (かまど)
*   `conveyor` (ベルトコンベア)
*   `assembler` (組立機)
*   `storage_chest` (ストレージチェスト)
*   `splitter` (分配器) - **NEW**

### 5. 施設のクラフトコスト

*   `miner`: `iron_plate` (2), `copper_plate` (1)
*   `furnace`: `iron_plate` (2), `copper_plate` (1)
*   `conveyor`: `iron_plate` (1)
*   `assembler`: `iron_plate` (5)
*   `storage_chest`: `iron_plate` (2), `plastic` (1)
*   `splitter`: `iron_plate` (3), `copper_plate` (1)

---

### 資源と施設の依存関係

```mermaid
graph TD
    subgraph Resources
        iron_ore[鉄鉱石]
        copper_ore[銅鉱石]
        coal[石炭]
        quartz_ore[石英鉱石]
    end

    subgraph Basic Materials
        iron_plate[鉄板]
        copper_plate[銅板]
        copper_wire[銅線]
        gear[歯車]
        glass[ガラス]
        plastic[プラスチック]
    end

    subgraph Intermediate Products
        electronic_circuit[電子基板]
        advanced_processor[高度プロセッサ]
        robot_body[ロボットボディ]
    end

    subgraph Final Product
        robot[ロボット]
    end

    subgraph Buildings
        miner[採掘機]
        furnace[かまど]
        conveyor[ベルトコンベア]
        assembler[組立機]
        storage_chest[ストレージチェスト]
        splitter[分配器]
    end

    %% Production Flow
    miner --> iron_ore
    miner --> copper_ore
    miner --> coal
    miner --> quartz_ore

    iron_ore + coal --> furnace
    furnace --> iron_plate

    copper_ore + coal --> furnace
    furnace --> copper_plate

    quartz_ore + coal --> furnace
    furnace --> glass

    coal --> furnace
    furnace --> plastic

    copper_plate --> assembler
    assembler --> copper_wire

    iron_plate --> assembler
    assembler --> gear

    iron_plate + copper_wire --> assembler
    assembler --> electronic_circuit

    electronic_circuit + glass + plastic --> assembler
    assembler --> advanced_processor

    advanced_processor + gear + iron_plate --> assembler
    assembler --> robot_body

    robot_body + electronic_circuit + advanced_processor --> assembler
    assembler --> robot

    %% Building Costs
    iron_plate -- 2個, copper_plate -- 1個 --> miner
    iron_plate -- 2個, copper_plate -- 1個 --> furnace
    iron_plate -- 1個 --> conveyor
    iron_plate -- 5個 --> assembler
    iron_plate -- 2個, plastic -- 1個 --> storage_chest
    iron_plate -- 3個, copper_plate -- 1個 --> splitter

    %% Item Flow (simplified for clarity)
    miner -- 出力 --> conveyor
    furnace -- 出力 --> conveyor
    assembler -- 出力 --> conveyor
    conveyor -- 出力 --> storage_chest
    conveyor -- 出力 --> splitter
    splitter -- 出力 --> conveyor
```
