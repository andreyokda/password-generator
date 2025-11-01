class PasswordGenerator {
    constructor() {
        this.charSets = {
            uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            lowercase: 'abcdefghijklmnopqrstuvwxyz',
            numbers: '0123456789',
            symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
        };
        
        this.similarChars = 'il1Lo0O';
        this.history = JSON.parse(localStorage.getItem('passwordHistory')) || [];
        
        this.initializeElements();
        this.bindEvents();
        this.loadSettings();
        this.updateHistoryDisplay();
        
        this.updateStrength(0);
    }

    initializeElements() {
        this.passwordOutput = document.getElementById('passwordOutput');
        this.strengthBar = document.querySelector('.strength-bar');
        this.strengthText = document.getElementById('strengthText');
        this.lengthValue = document.getElementById('lengthValue');
        
        this.lengthSlider = document.getElementById('lengthSlider');
        this.uppercase = document.getElementById('uppercase');
        this.lowercase = document.getElementById('lowercase');
        this.numbers = document.getElementById('numbers');
        this.symbols = document.getElementById('symbols');
        this.excludeSimilar = document.getElementById('excludeSimilar');
        
        this.generateBtn = document.getElementById('generateBtn');
        this.copyBtn = document.getElementById('copyBtn');
        this.saveBtn = document.getElementById('saveBtn');
        
        this.historyList = document.getElementById('historyList');
        this.notification = document.getElementById('notification');
    }

    bindEvents() {
        this.generateBtn.addEventListener('click', () => this.generatePassword());
        this.copyBtn.addEventListener('click', () => this.copyToClipboard());
        this.saveBtn.addEventListener('click', () => this.saveSettings());
        
        this.lengthSlider.addEventListener('input', (e) => {
            this.lengthValue.textContent = e.target.value;
        });
    }

    getAvailableChars() {
        let chars = '';
        
        if (this.uppercase.checked) chars += this.charSets.uppercase;
        if (this.lowercase.checked) chars += this.charSets.lowercase;
        if (this.numbers.checked) chars += this.charSets.numbers;
        if (this.symbols.checked) chars += this.charSets.symbols;
        
        if (!chars) {
            chars = this.charSets.lowercase + this.charSets.uppercase + this.charSets.numbers;
            this.lowercase.checked = true;
            this.uppercase.checked = true;
            this.numbers.checked = true;
        }
        
        if (this.excludeSimilar.checked) {
            chars = chars.split('').filter(char => 
                !this.similarChars.includes(char)
            ).join('');
        }
        
        return chars;
    }

    generatePassword() {
        const length = parseInt(this.lengthSlider.value);
        const availableChars = this.getAvailableChars();
        
        if (availableChars.length === 0) {
            this.passwordOutput.value = '';
            this.passwordOutput.placeholder = 'Выберите хотя бы один тип символов';
            this.updateStrength(0);
            return;
        }
        
        let password = '';
        const array = new Uint32Array(length);
        window.crypto.getRandomValues(array);
        
        for (let i = 0; i < length; i++) {
            password += availableChars[array[i] % availableChars.length];
        }
        
        this.passwordOutput.value = password;
        this.passwordOutput.placeholder = 'Нажмите Сгенерировать для создания пароля';
        this.updateStrength(this.calculateStrength(password));
    }

    calculateStrength(password) {
        let strength = 0;
        const length = password.length;
        
        if (length >= 8) strength += 1;
        if (length >= 12) strength += 1;
        if (length >= 16) strength += 1;
        
        if (/[a-z]/.test(password)) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[^a-zA-Z0-9]/.test(password)) strength += 1;
        
        return Math.min(strength, 4);
    }

    updateStrength(strength) {
        const strengthClasses = ['strength-weak', 'strength-medium', 'strength-strong', 'strength-very-strong'];
        const strengthTexts = ['Слабый', 'Средний', 'Надежный', 'Очень надежный'];
        const strengthColors = ['#e74c3c', '#f39c12', '#2ecc71', '#27ae60'];
        
        this.strengthBar.className = 'strength-bar';
        
        if (strength > 0) {
            this.strengthBar.classList.add(strengthClasses[strength - 1]);
            this.strengthText.textContent = `Надежность: ${strengthTexts[strength - 1]}`;
            this.strengthText.style.color = strengthColors[strength - 1];
        } else {
            this.strengthText.textContent = 'Надежность: -';
            this.strengthText.style.color = '#7f8c8d';
        }
    }

    async copyToClipboard() {
        if (!this.passwordOutput.value) {
            this.showNotification('Сначала сгенерируйте пароль!', 'error');
            return;
        }
        
        try {
            await navigator.clipboard.writeText(this.passwordOutput.value);
            this.showNotification('Пароль скопирован!');
            this.addToHistory(this.passwordOutput.value);
        } catch (err) {
            this.passwordOutput.select();
            document.execCommand('copy');
            this.showNotification('Пароль скопирован!');
            this.addToHistory(this.passwordOutput.value);
        }
    }

    addToHistory(password) {
        const timestamp = new Date().toLocaleString();
        const historyItem = { password, timestamp };
        
        this.history = this.history.filter(item => item.password !== password);
        
        this.history.unshift(historyItem);
        
        if (this.history.length > 10) {
            this.history = this.history.slice(0, 10);
        }
        
        localStorage.setItem('passwordHistory', JSON.stringify(this.history));
        this.updateHistoryDisplay();
    }

    updateHistoryDisplay() {
        if (this.history.length === 0) {
            this.historyList.innerHTML = '<p class="empty-history">История пуста</p>';
            return;
        }
        
        this.historyList.innerHTML = this.history.map(item => `
            <div class="history-item">
                <span class="history-password">${item.password}</span>
                <small>${item.timestamp}</small>
                <button class="history-copy" onclick="generator.copyHistoryItem('${item.password}')" title="Копировать">📋</button>
            </div>
        `).join('');
    }

    copyHistoryItem(password) {
        this.passwordOutput.value = password;
        this.updateStrength(this.calculateStrength(password));
        this.copyToClipboard();
    }

    showNotification(message, type = 'success') {
        this.notification.textContent = message;
        this.notification.className = 'notification';
        this.notification.classList.add('show');
        
        if (type === 'error') {
            this.notification.style.background = '#e74c3c';
        } else {
            this.notification.style.background = '#2ecc71';
        }
        
        setTimeout(() => {
            this.notification.classList.remove('show');
        }, 2000);
    }

    saveSettings() {
        const settings = {
            length: this.lengthSlider.value,
            uppercase: this.uppercase.checked,
            lowercase: this.lowercase.checked,
            numbers: this.numbers.checked,
            symbols: this.symbols.checked,
            excludeSimilar: this.excludeSimilar.checked
        };
        
        localStorage.setItem('passwordGeneratorSettings', JSON.stringify(settings));
        this.showNotification('Настройки сохранены!');
    }

    loadSettings() {
        const saved = JSON.parse(localStorage.getItem('passwordGeneratorSettings'));
        
        if (saved) {
            this.lengthSlider.value = saved.length;
            this.lengthValue.textContent = saved.length;
            this.uppercase.checked = saved.uppercase;
            this.lowercase.checked = saved.lowercase;
            this.numbers.checked = saved.numbers;
            this.symbols.checked = saved.symbols;
            this.excludeSimilar.checked = saved.excludeSimilar;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.generator = new PasswordGenerator();
});