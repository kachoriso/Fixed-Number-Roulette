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
const passwordInput = document.getElementById('passwordInput');
const passwordMessage = document.getElementById('passwordMessage');
const submitPassword = document.getElementById('submitPassword');
const cancelPassword = document.getElementById('cancelPassword');

// あいことば機能の状態
let boostActive = false; // 10倍ブースト有効フラグ

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

// ===== あいことば機能 =====

// 今日の日付を取得（YYYY-MM-DD形式）
function getTodayDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 日付から今日のあいことばを決定
function getTodayPassword() {
    const passwords = ['アザラシ最高', 'タマザラシ最高', 'かわいい'];
    const today = new Date();
    // 日付を使ってインデックスを決定（日によって変わる）
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    const index = dayOfYear % passwords.length;
    return passwords[index];
}

// 今日すでに入力済みかチェック
function hasEnteredToday() {
    const lastEntryDate = localStorage.getItem('lastPasswordEntry');
    const todayDate = getTodayDateString();
    return lastEntryDate === todayDate;
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
    if (hasEnteredToday()) {
        if (boostActive) {
            passwordMessage.textContent = '今日はすでにブーストが有効です！🎉';
            passwordMessage.className = 'password-message success';
        } else {
            passwordMessage.textContent = '今日はすでに入力済みです。明日また挑戦してください！';
            passwordMessage.className = 'password-message error';
        }
        passwordInput.disabled = true;
        submitPassword.disabled = true;
    } else {
        passwordMessage.textContent = '今日のあいことばを入力してください';
        passwordMessage.className = 'password-message';
        passwordInput.disabled = false;
        submitPassword.disabled = false;
        passwordInput.value = '';
    }
    
    passwordPopup.classList.add('show');
    if (!passwordInput.disabled) {
        passwordInput.focus();
    }
}

// あいことばポップアップを閉じる
function closePasswordPopup() {
    passwordPopup.classList.remove('show');
    passwordInput.value = '';
}

// あいことばを確認
function checkPassword() {
    if (hasEnteredToday()) {
        return;
    }
    
    const enteredPassword = passwordInput.value.trim();
    const correctPassword = getTodayPassword();
    
    if (enteredPassword === correctPassword) {
        // 正解！
        const todayDate = getTodayDateString();
        localStorage.setItem('lastPasswordEntry', todayDate);
        localStorage.setItem('boostActiveDate', todayDate);
        boostActive = true;
        sealButton.classList.add('active');
        document.body.classList.add('boost-active');
        
        // ルーレットを再描画して10倍表示に更新
        drawRoulette(currentRotation);
        
        passwordMessage.textContent = '正解！ 今日は回数が10倍になります！🎉';
        passwordMessage.className = 'password-message success';
        passwordInput.disabled = true;
        submitPassword.disabled = true;
        
        // ボタンを非表示に
        sealButton.classList.add('hidden');
        
        // 2秒後に自動で閉じる
        setTimeout(() => {
            closePasswordPopup();
        }, 2000);
    } else {
        // 不正解
        const todayDate = getTodayDateString();
        localStorage.setItem('lastPasswordEntry', todayDate);
        
        passwordMessage.textContent = '残念...不正解です。明日また挑戦してください！';
        passwordMessage.className = 'password-message error';
        passwordInput.disabled = true;
        submitPassword.disabled = true;
        
        // ボタンを非表示に
        sealButton.classList.add('hidden');
        
        // 2秒後に自動で閉じる
        setTimeout(() => {
            closePasswordPopup();
        }, 2000);
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
submitPassword.addEventListener('click', checkPassword);
cancelPassword.addEventListener('click', closePasswordPopup);

// Enterキーでもあいことばを送信
passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !passwordInput.disabled) {
        checkPassword();
    }
});

// あいことばポップアップの背景をクリックしても閉じる
passwordPopup.addEventListener('click', (e) => {
    if (e.target === passwordPopup) {
        closePasswordPopup();
    }
});

// 初期化
checkBoostStatus(); // ブーストの状態を確認
drawRoulette(); // ルーレットを描画
