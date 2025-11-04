// ルーレットの項目と確率設定
const rouletteItems = [
    { label: '1回', value: 1, weight: 25, color: '#FF6B6B' },
    { label: '2回', value: 2, weight: 25, color: '#4ECDC4' },
    { label: '3回', value: 3, weight: 25, color: '#45B7D1' },
    { label: '5回', value: 5, weight: 12, color: '#FFA07A' },
    { label: '10回', value: 10, weight: 8, color: '#98D8C8' },
    { label: '20回', value: 20, weight: 3, color: '#FFD93D' },
    { label: '0回', value: 0, weight: 2, color: '#A8E6CF' }
];

// 合計の重み
const totalWeight = rouletteItems.reduce((sum, item) => sum + item.weight, 0);

// Canvas要素とコンテキスト
const canvas = document.getElementById('rouletteCanvas');
const ctx = canvas.getContext('2d');
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const radius = canvas.width / 2 - 20;

// ルーレットの状態
let currentRotation = 0;
let isSpinning = false;

// ボタン要素
const startButton = document.getElementById('startButton');
const resultPopup = document.getElementById('resultPopup');
const resultText = document.getElementById('resultText');
const closeButton = document.getElementById('closeButton');

// あいことば機能の要素
const sealButton = document.getElementById('sealButton');
const passwordPopup = document.getElementById('passwordPopup');
const passwordChoices = document.getElementById('passwordChoices');
const passwordMessage = document.getElementById('passwordMessage');
const cancelPassword = document.getElementById('cancelPassword');
const hintButton = document.getElementById('hintButton');
const hintMessage = document.getElementById('hintMessage');

// 開発用リセットボタン
// const devResetButton = document.getElementById('devResetButton');

// 回数カウンター要素
const spinCountElement = document.getElementById('spinCount');

// あいことば機能の状態
let boostActive = false; // 10倍ブースト有効フラグ
let todaySpinCount = 0; // 今日のルーレット回数

// ルーレットを描画
function drawRoulette(rotation = 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 矢印は真上（-π/2の位置）にある
    // rotationは時計回りの回転角度
    let currentAngle = rotation;
    
    rouletteItems.forEach((item, index) => {
        // 各項目の角度をweightに基づいて計算
        const angleSize = (item.weight / totalWeight) * Math.PI * 2;
        const startAngle = currentAngle;
        const endAngle = currentAngle + angleSize;
        
        // セクションを描画
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        
        // ブースト有効時は色をより鮮やかに
        if (boostActive) {
            // 色を明るくして金色の輝きを追加
            ctx.fillStyle = item.color;
        } else {
            ctx.fillStyle = item.color;
        }
        ctx.fill();
        
        // ブースト有効時は枠を金色に
        ctx.strokeStyle = boostActive ? '#FFD700' : 'white';
        ctx.lineWidth = boostActive ? 4 : 3;
        ctx.stroke();
        
        // テキストを描画
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + angleSize / 2);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // ブースト有効時はテキストを10倍に
        let displayLabel = item.label;
        if (boostActive && item.value > 0) {
            displayLabel = `${item.value * 10}回`;
        }
        
        // 小さいセクションは文字サイズを調整
        const baseFontSize = angleSize < 0.3 ? 18 : 24;
        const fontSize = boostActive ? baseFontSize + 2 : baseFontSize;
        ctx.font = `bold ${fontSize}px Arial`;
        
        // ブースト有効時は金色の光彩効果
        if (boostActive) {
            ctx.fillStyle = '#FFD700';
            ctx.shadowColor = '#FFA500';
            ctx.shadowBlur = 8;
        } else {
            ctx.fillStyle = 'white';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 4;
        }
        
        ctx.fillText(displayLabel, radius * 0.65, 0);
        ctx.restore();
        
        // 次のセクションの開始角度を更新
        currentAngle = endAngle;
    });
    
    // 中央の円を描画
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, Math.PI * 2);
    ctx.fillStyle = boostActive ? '#FFD700' : 'white';
    ctx.fill();
    ctx.strokeStyle = boostActive ? '#FFA500' : '#667eea';
    ctx.lineWidth = 4;
    ctx.stroke();
    
    // ブースト有効時は中央に星マーク
    if (boostActive) {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'white';
        ctx.fillText('★', 0, 0);
        ctx.restore();
    }
}

// 重みに基づいてランダムにアイテムを選択
function selectRandomItem() {
    const random = Math.random() * totalWeight;
    let cumulativeWeight = 0;
    
    for (let i = 0; i < rouletteItems.length; i++) {
        cumulativeWeight += rouletteItems[i].weight;
        if (random <= cumulativeWeight) {
            return i;
        }
    }
    
    return 0;
}

// 矢印が指しているアイテムを取得
function getItemAtArrow(rotation) {
    // 矢印は真上（-π/2）にある
    const arrowAngle = -Math.PI / 2;
    
    // 矢印の位置を正規化（0-2πの範囲に）
    let normalizedArrowAngle = (arrowAngle - rotation) % (Math.PI * 2);
    if (normalizedArrowAngle < 0) {
        normalizedArrowAngle += Math.PI * 2;
    }
    
    // どのアイテムがその角度にあるか判定
    let cumulativeAngle = 0;
    for (let i = 0; i < rouletteItems.length; i++) {
        const angleSize = (rouletteItems[i].weight / totalWeight) * Math.PI * 2;
        if (normalizedArrowAngle >= cumulativeAngle && normalizedArrowAngle < cumulativeAngle + angleSize) {
            return i;
        }
        cumulativeAngle += angleSize;
    }
    
    return 0;
}

// ルーレットを回転させる
function spinRoulette() {
    if (isSpinning) return;
    
    isSpinning = true;
    startButton.disabled = true;
    startButton.textContent = '回転中...';
    canvas.classList.add('spinning');
    
    // 回数をカウントアップ
    incrementSpinCount();
    
    // 選ばれるアイテムのインデックスを決定
    const selectedIndex = selectRandomItem();
    
    // rotation = 0 のとき、最初のアイテムは右（0度）から始まる
    // 選択されたアイテムの中心角度を計算（0度からの相対角度）
    let cumulativeAngle = 0;
    for (let i = 0; i < selectedIndex; i++) {
        cumulativeAngle += (rouletteItems[i].weight / totalWeight) * Math.PI * 2;
    }
    // 選択されたアイテムの中心角度
    const selectedItemAngleSize = (rouletteItems[selectedIndex].weight / totalWeight) * Math.PI * 2;
    const selectedItemCenterAngle = cumulativeAngle + selectedItemAngleSize / 2;
    
    // 矢印は真上（-π/2）にある
    // 選択されたアイテムの中心を矢印の位置に合わせる
    // 複数回転させて自然な感じに
    const extraSpins = 5 + Math.random() * 3; // 5-8回転
    const arrowPosition = -Math.PI / 2;
    const targetAngle = extraSpins * Math.PI * 2 + (arrowPosition - selectedItemCenterAngle);
    
    const startTime = Date.now();
    const duration = 4000; // 4秒間回転
    
    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // イージング関数（最初速く、だんだん遅く）
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        currentRotation = targetAngle * easeOut;
        drawRoulette(currentRotation);
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // 回転終了
            isSpinning = false;
            startButton.disabled = false;
            startButton.textContent = 'スタート';
            canvas.classList.remove('spinning');
            
            // 実際に矢印が指しているアイテムを取得して表示
            const actualIndex = getItemAtArrow(currentRotation);
            showResult(rouletteItems[actualIndex]);
        }
    }
    
    animate();
}

// 結果をポップアップで表示
function showResult(item) {
    let displayValue = item.value;
    let displayLabel = item.label;
    
    // ブーストが有効な場合
    if (boostActive) {
        // 0回以外は10倍にする
        if (item.value > 0) {
            displayValue = item.value * 10;
            displayLabel = `${displayValue}回`;
        }
        
        // ブーストモードを解除（1回使用したら終了）
        deactivateBoost();
    }
    
    resultText.textContent = displayLabel;
    resultPopup.classList.add('show');
}

// ブーストモードを解除
function deactivateBoost() {
    // ブースト状態を解除
    boostActive = false;
    localStorage.removeItem('boostActiveDate');
    
    // スタイルを通常に戻す
    sealButton.classList.remove('active');
    document.body.classList.remove('boost-active');
    
    // ルーレットを通常表示に再描画
    drawRoulette(currentRotation);
}

// ポップアップを閉じる
function closePopup() {
    resultPopup.classList.remove('show');
}

// ===== 回数カウンター機能 =====

// 今日の日付を取得（YYYY-MM-DD形式）
// テスト用のオフセットがある場合はそれを適用
function getTodayDateString() {
    const testOffset = parseInt(localStorage.getItem('testDayOffset') || '0');
    const today = new Date();
    today.setDate(today.getDate() + testOffset);
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 回数を読み込んで表示を更新
function loadSpinCount() {
    const savedDate = localStorage.getItem('spinCountDate');
    const savedCount = localStorage.getItem('spinCount');
    const todayDate = getTodayDateString();
    
    // 日付が変わっていたらリセット
    if (savedDate !== todayDate) {
        todaySpinCount = 0;
        localStorage.setItem('spinCountDate', todayDate);
        localStorage.setItem('spinCount', '0');
    } else {
        // 今日の回数を読み込む
        todaySpinCount = parseInt(savedCount) || 0;
    }
    
    // 表示を更新
    updateSpinCountDisplay();
}

// 回数をカウントアップ
function incrementSpinCount() {
    todaySpinCount++;
    localStorage.setItem('spinCount', todaySpinCount.toString());
    updateSpinCountDisplay();
}

// 回数表示を更新
function updateSpinCountDisplay() {
    spinCountElement.textContent = todaySpinCount;
    
    // 回数に応じてアニメーション
    spinCountElement.style.animation = 'none';
    setTimeout(() => {
        spinCountElement.style.animation = 'countUp 0.5s ease-out';
    }, 10);
}

// ===== あいことば機能 =====

// あいことばの選択肢候補
const passwordCandidates = [
    'しぶき', 'ふぶき', 'ホシ', 'ココ', 'ココア', 
    '月', 'ましろ', 'かつのり', 'よう', 'ゴクウ', 
    'スカイ', 'ターボ', 'もちもち', 'はなまる', 'モヤ', 
    'ユキ', 'アラレ', 'おんぷ', '雪音', 'ごますけ', 'ももか'
];

// 各あいことばのヒント
const passwordHints = {
    'しぶき': 'オレ',
    'ふぶき': '冬の激しい雪のことです',
    'ホシ': '夜空に輝くものです',
    'ココ': '2文字のカタカナです',
    'ココア': 'コココ',
    '月': '1文字の漢字です',
    'ましろ': '色の名前が入っています',
    'かつのり': '人の名前のようです',
    'よう': '2文字のひらがなです',
    'ゴクウ': '有名な漫画のキャラクター名です',
    'スカイ': '英語で「空」という意味です',
    'ターボ': '車のエンジンに関係する言葉です',
    'もちもち': '繰り返しの言葉です',
    'はなまる': '良くできた時にもらえるものです',
    'モヤ': 'ソーダを作ります',
    'ユキ': '冬に降るものです',
    'アラレ': '氷の粒が降ってくる現象です',
    'おんぷ': '音楽に関係する言葉です',
    '雪音': '漢字とひらがなの組み合わせです',
    'ごますけ': 'ごまに関係する言葉です',
    'ももか': 'かわいいです'
};

// 日付ベースの疑似乱数生成器（シード値から決定的な乱数を生成）
function seededRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

// 今日の選択肢と正解を取得
function getTodayPasswordData() {
    const testOffset = parseInt(localStorage.getItem('testDayOffset') || '0');
    const today = new Date();
    today.setDate(today.getDate() + testOffset);
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    
    // 日付をシードとして使用
    const seed = dayOfYear;
    
    // 配列をシャッフル（Fisher-Yates）
    const shuffled = [...passwordCandidates];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(seededRandom(seed * 1000 + i) * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // 最初の4つを選択肢とする
    const choices = shuffled.slice(0, 4);
    
    // 選択肢の中に「ももか」が含まれている場合は、必ず「ももか」を正解にする
    let correctPassword;
    if (choices.includes('ももか')) {
        correctPassword = 'ももか';
    } else {
        // 4つの中から正解をランダムに1つ選ぶ
        const correctIndex = Math.floor(seededRandom(seed * 7919) * 4);
        correctPassword = choices[correctIndex];
    }
    
    return { choices, correctPassword };
}

// 今日すでに入力済みかチェック
function hasEnteredToday() {
    const lastEntryDate = localStorage.getItem('lastPasswordEntry');
    const todayDate = getTodayDateString();
    return lastEntryDate === todayDate;
}

// ヒントが使用可能かチェック（5日に1回）
function canUseHint() {
    const lastHintDate = localStorage.getItem('lastHintUsedDate');
    if (!lastHintDate) {
        return true; // 一度も使っていない場合は使用可能
    }
    
    const lastUsed = new Date(lastHintDate);
    const today = new Date();
    const diffTime = today - lastUsed;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays >= 5; // 5日以上経過していれば使用可能
}

// 次にヒントが使用可能になるまでの日数を計算
function getDaysUntilNextHint() {
    const lastHintDate = localStorage.getItem('lastHintUsedDate');
    if (!lastHintDate) {
        return 0;
    }
    
    const lastUsed = new Date(lastHintDate);
    const today = new Date();
    const diffTime = today - lastUsed;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, 5 - diffDays);
}

// ブーストが有効かチェック
function checkBoostStatus() {
    const boostDate = localStorage.getItem('boostActiveDate');
    const todayDate = getTodayDateString();
    if (boostDate === todayDate) {
        boostActive = true;
        sealButton.classList.add('active');
        document.body.classList.add('boost-active');
    } else {
        boostActive = false;
        sealButton.classList.remove('active');
        document.body.classList.remove('boost-active');
    }
    
    // 入力済みかチェックしてボタンの表示/非表示を切り替え
    if (hasEnteredToday()) {
        sealButton.classList.add('hidden');
    } else {
        sealButton.classList.remove('hidden');
    }
}

// あいことばポップアップを開く
function openPasswordPopup() {
    // ヒントメッセージをリセット
    hintMessage.textContent = '';
    hintMessage.className = 'hint-message';
    
    if (hasEnteredToday()) {
        if (boostActive) {
            passwordMessage.textContent = '今日はすでにブーストが有効です！🎉';
            passwordMessage.className = 'password-message success';
        } else {
            passwordMessage.textContent = '今日はすでに選択済みです。明日また挑戦してください！';
            passwordMessage.className = 'password-message error';
        }
        passwordChoices.innerHTML = '';
        hintButton.style.display = 'none'; // ヒントボタンを非表示
    } else {
        passwordMessage.textContent = '今日のあいことばを選んでください';
        passwordMessage.className = 'password-message';
        
        // 今日の選択肢を取得
        const { choices } = getTodayPasswordData();
        
        // 選択肢ボタンを生成
        passwordChoices.innerHTML = '';
        choices.forEach((choice) => {
            const button = document.createElement('button');
            button.className = 'password-choice-button';
            button.textContent = choice;
            button.addEventListener('click', () => checkPasswordChoice(choice));
            passwordChoices.appendChild(button);
        });
        
        // ヒントボタンの状態を更新
        updateHintButton();
    }
    
    passwordPopup.classList.add('show');
}

// ヒントボタンの状態を更新
function updateHintButton() {
    if (canUseHint()) {
        hintButton.style.display = 'inline-block';
        hintButton.disabled = false;
        hintButton.textContent = '💡 ヒントを見る';
        hintButton.className = 'hint-button';
    } else {
        hintButton.style.display = 'inline-block';
        hintButton.disabled = true;
        const daysLeft = getDaysUntilNextHint();
        hintButton.textContent = `💡 ヒント（あと${daysLeft}日）`;
        hintButton.className = 'hint-button disabled';
    }
}

// ヒントを表示
function showHint() {
    if (!canUseHint()) {
        const daysLeft = getDaysUntilNextHint();
        hintMessage.textContent = `ヒントは${daysLeft}日後に使用できます`;
        hintMessage.className = 'hint-message error';
        return;
    }
    
    const { correctPassword } = getTodayPasswordData();
    const hint = passwordHints[correctPassword];
    
    // ヒント使用日を保存
    const todayDate = getTodayDateString();
    localStorage.setItem('lastHintUsedDate', todayDate);
    
    // ヒントを表示
    hintMessage.textContent = `ヒント: ${hint}`;
    hintMessage.className = 'hint-message show';
    
    // ボタンを無効化
    hintButton.disabled = true;
    hintButton.textContent = '💡 ヒント使用済み';
    hintButton.className = 'hint-button used';
}

// あいことばポップアップを閉じる
function closePasswordPopup() {
    passwordPopup.classList.remove('show');
}

// 選択したあいことばを確認
function checkPasswordChoice(selectedChoice) {
    if (hasEnteredToday()) {
        return;
    }
    
    const { correctPassword } = getTodayPasswordData();
    
    // すべての選択肢ボタンを取得
    const allButtons = passwordChoices.querySelectorAll('.password-choice-button');
    
    // すべてのボタンを無効化
    allButtons.forEach(button => {
        button.disabled = true;
        button.style.cursor = 'not-allowed';
        
        // 正解のボタンを緑色に
        if (button.textContent === correctPassword) {
            button.classList.add('correct');
        }
        
        // 選択したボタンが不正解の場合は赤色に
        if (button.textContent === selectedChoice && selectedChoice !== correctPassword) {
            button.classList.add('incorrect');
        }
    });
    
    if (selectedChoice === correctPassword) {
        // 正解！
        const todayDate = getTodayDateString();
        localStorage.setItem('lastPasswordEntry', todayDate);
        localStorage.setItem('boostActiveDate', todayDate);
        boostActive = true;
        sealButton.classList.add('active');
        document.body.classList.add('boost-active');
        
        // ルーレットを再描画して10倍表示に更新
        drawRoulette(currentRotation);
        
        passwordMessage.textContent = `正解！「${correctPassword}」が当たりでした！🎉\n今日は回数が10倍になります！`;
        passwordMessage.className = 'password-message success';
        
        // ボタンを非表示に
        sealButton.classList.add('hidden');
        
        // 3秒後に自動で閉じる
        setTimeout(() => {
            closePasswordPopup();
        }, 3000);
    } else {
        // 不正解
        const todayDate = getTodayDateString();
        localStorage.setItem('lastPasswordEntry', todayDate);
        
        passwordMessage.textContent = `残念...不正解です。\n正解は「${correctPassword}」でした。\n明日また挑戦してください！`;
        passwordMessage.className = 'password-message error';
        
        // ボタンを非表示に
        sealButton.classList.add('hidden');
        
        // 3秒後に自動で閉じる
        setTimeout(() => {
            closePasswordPopup();
        }, 3000);
    }
}

// イベントリスナー
startButton.addEventListener('click', spinRoulette);
closeButton.addEventListener('click', closePopup);

// ポップアップの背景をクリックしても閉じる
resultPopup.addEventListener('click', (e) => {
    if (e.target === resultPopup) {
        closePopup();
    }
});

// あいことば機能のイベントリスナー
sealButton.addEventListener('click', openPasswordPopup);
cancelPassword.addEventListener('click', closePasswordPopup);
hintButton.addEventListener('click', showHint);

// あいことばポップアップの背景をクリックしても閉じる
passwordPopup.addEventListener('click', (e) => {
    if (e.target === passwordPopup) {
        closePasswordPopup();
    }
});

// ===== 開発用リセット機能 =====

// 全データをリセットする関数（グローバルに公開してコンソールからも使用可能）
function resetAllData() {
    if (confirm('すべてのデータをリセットしますか？\n\n以下がリセットされます：\n・今日の回数\n・あいことば入力状態\n・ブースト状態\n・ヒント使用状態\n\n※日付が1日進み、新しい選択肢が表示されます')) {
        // 日付オフセットを進める（異なる選択肢を表示するため）
        const currentOffset = parseInt(localStorage.getItem('testDayOffset') || '0');
        localStorage.setItem('testDayOffset', (currentOffset + 1).toString());
        
        // localStorageの状態データをクリア
        localStorage.removeItem('spinCountDate');
        localStorage.removeItem('spinCount');
        localStorage.removeItem('lastPasswordEntry');
        localStorage.removeItem('boostActiveDate');
        localStorage.removeItem('lastHintUsedDate');
        
        // 状態をリセット
        todaySpinCount = 0;
        boostActive = false;
        
        // 表示を更新
        updateSpinCountDisplay();
        sealButton.classList.remove('active');
        sealButton.classList.remove('hidden');
        document.body.classList.remove('boost-active');
        drawRoulette(currentRotation);
        
        // 今日の選択肢を確認（デバッグ用）
        const { choices, correctPassword } = getTodayPasswordData();
        
        alert(`✅ データリセット完了！\n\n今日の選択肢: ${choices.join(', ')}\n正解: ${correctPassword}`);
        console.log('🔄 データリセット完了');
        console.log('今日の選択肢:', choices);
        console.log('正解:', correctPassword);
    }
}

// 日付オフセットを完全にリセットする関数（本番の日付に戻す）
function resetToRealDate() {
    if (confirm('テスト用の日付オフセットをリセットして、本番の日付に戻しますか？')) {
        localStorage.removeItem('testDayOffset');
        localStorage.removeItem('spinCountDate');
        localStorage.removeItem('spinCount');
        localStorage.removeItem('lastPasswordEntry');
        localStorage.removeItem('boostActiveDate');
        localStorage.removeItem('lastHintUsedDate');
        
        todaySpinCount = 0;
        boostActive = false;
        
        updateSpinCountDisplay();
        sealButton.classList.remove('active');
        sealButton.classList.remove('hidden');
        document.body.classList.remove('boost-active');
        drawRoulette(currentRotation);
        
        alert('✅ 本番の日付に戻しました！');
        console.log('🔄 本番の日付に戻しました');
    }
}

// コンソールからも使用できるようにグローバルに公開
window.resetAllData = resetAllData;
window.resetToRealDate = resetToRealDate;

// 開発用リセットボタンのイベントリスナー
// devResetButton.addEventListener('click', resetAllData);

// 初期化
loadSpinCount(); // 回数を読み込み
checkBoostStatus(); // ブーストの状態を確認
drawRoulette(); // ルーレットを描画

// コンソールにヒントを表示
console.log('🔧 開発用コマンド:');
console.log('  resetAllData() - データをリセットして日付を1日進める（新しい選択肢）');
console.log('  resetToRealDate() - テスト用日付をリセットして本番の日付に戻す');

// テスト中の場合は警告を表示
const testOffset = parseInt(localStorage.getItem('testDayOffset') || '0');
if (testOffset !== 0) {
    console.warn(`⚠️ テストモード: 日付が${testOffset}日オフセットされています`);
    console.log('  本番の日付に戻すには resetToRealDate() を実行してください');
}
