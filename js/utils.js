// js/utils.js

export function getItemColor(itemType) {
    switch (itemType) {
        case 'iron_ore': return 'saddlebrown';      // 鉄鉱石: 濃い茶色
        case 'iron_plate': return 'lightgray';      // 鉄板: 明るい銀色
        case 'copper_ore': return 'darkorange';     // 銅鉱石: 濃いオレンジ
        case 'copper_plate': return 'orange';       // 銅板: オレンジ
        case 'coal': return 'dimgray';              // 石炭: 暗い灰色
        case 'quartz_ore': return 'lightskyblue';   // 石英鉱石: 青みがかった白
        case 'copper_wire': return 'gold';          // 銅線: 金色
        case 'gear': return 'gray';                 // 歯車: 灰色
        case 'glass': return 'skyblue';             // ガラス: 空色
        case 'plastic': return 'mediumseagreen';    // プラスチック: 中程度の海緑色
        case 'electronic_circuit': return 'green';  // 電子基板: 緑色
        case 'advanced_processor': return 'darkblue'; // 高度プロセッサ: 濃い青
        case 'robot_body': return 'purple';     // ロボットボディ: 紫色
        case 'robot': return 'red';        // ロボット: 赤色
        default: return 'white';
    }
}